document.addEventListener('DOMContentLoaded', () => {
  const analyzeButton = document.getElementById('analyzeButton');
  const analysisResults = document.getElementById('analysisResults');

  console.log("DOMContentLoaded event fired", analyzeButton, analysisResults);
  analyzeButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getInterestingWords' }, response => {
      if (response && response.interestingWords) {
        analysisResults.innerHTML = '<h2>Most interesting words</h2>';
        const list = document.createElement('ul');
        response.interestingWords.forEach(wordObj => {
          const listItem = document.createElement('li');
          listItem.textContent = `${wordObj.word}: ${wordObj.interestingness.toFixed(2)}`;
          list.appendChild(listItem);
        });
        analysisResults.appendChild(list);
      } else {
        analysisResults.textContent = 'No analysis results available.';
      }
    });
  });
});
