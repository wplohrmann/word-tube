chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getInterestingWords') {
        (async () => {
            try {
                const response = await fetch(chrome.runtime.getURL('common_german_words.json'));
                const commonWords = await response.json();
                chrome.storage.local.get('combinedCaptions', (result) => {
                    console.log("Combined captions retrieved from storage:", result.combinedCaptions);
                    const captions = result.combinedCaptions || "";
                    const interestingWords = computeInterestingWords(message.captions || captions, commonWords);
                    sendResponse({ interestingWords, combinedCaptions: captions });
                });
            } catch (error) {
                console.error("Error processing getInterestingWords message:", error);
                sendResponse({ error: "Failed to process request" });
            }
        })();
        return true; // Indicate that the response will be sent asynchronously
    }
});

chrome.webRequest.onCompleted.addListener(
  async (details) => {
    if (
      details.url.includes("https://www.youtube.com/api/timedtext") &&
      details.initiator === "https://www.youtube.com"
    ) {
      try {
        const response = await fetch(details.url, {
          headers: { 'X-Requested-By': 'word-tube-extension' } // Add a custom header to identify extension requests
        });
        if (response.ok) {
          const captionsText = await response.text();
          console.log("Captured captions:", captionsText);
          const captionsJson = JSON.parse(captionsText);
          const combinedText = captionsJson.events
            .flatMap(event => event.segs.map(seg => seg.utf8))
            .join('\n');
          console.log("Combined captions text:", combinedText);
          chrome.storage.local.set({ combinedCaptions: combinedText }, () => {
            console.log("Combined captions text saved to storage.");
          });
        } else {
          console.error("Failed to fetch captions from intercepted request:", response.statusText);
        }
      } catch (error) {
        console.error("Error processing intercepted request:", error);
      }
    }
  },
  { urls: ["https://www.youtube.com/api/timedtext*"], types: ["xmlhttprequest"] }
);

function computeInterestingWords(captionsText, commonWords) {
  const wordCounts = {};
  const words = captionsText.toLowerCase().match(/\b\w+\b/g);

  // Count occurrences of each word in the captions
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  // Compute interestingness scores
  const interestingWords = [];
  for (const [word, count] of Object.entries(wordCounts)) {
    if (commonWords[word] && commonWords[word] <= 100) {
      // Word is among the top 100 most common words
      continue;
    }

    const interestingness = commonWords[word] ? count / commonWords[word] : 1;
    interestingWords.push({ word, interestingness });
  }

  // Sort by interestingness in descending order and take the top 100
  interestingWords.sort((a, b) => b.interestingness - a.interestingness);
  return interestingWords.slice(0, 100);
}
