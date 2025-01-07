window.onload = function () {
  const apiStuff = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'Hello, ChatGPT!' }),
}
  let url=(endpoint)=>`https://9izl1e71m2.execute-api.us-west-1.amazonaws.com/prod/${endpoint}`
  async function sendMessageToChatGPT() {
    const response = await fetch(url('chatgpt'), apiStuff);

    if (!response.ok) {
        throw new Error('Failed to get response from server.');
    }

    const data = await response.json();
    let chatResponse = data.choices[0].message.content
    chatResponse = chatResponse.replace(/"/g, '');
    document.getElementById('chatOutput').textContent = chatResponse;
    return chatResponse; 
}

async function getStyleFromChatGPT() {
  const response = await fetch(url('chatgpt-style'), apiStuff);

  if (!response.ok) {
      throw new Error('Failed to get response from server.');
  }

  const data = await response.json();
  let chatResponse = data.choices[0].message.content
  chatResponse = chatResponse.replace(/`/g, '');
  const style = document.createElement('style');
  document.head.append(style);
  style.textContent = chatResponse;
  document.querySelectorAll('.hideWhileLoading').forEach((element) => {
    element.classList.remove('hideWhileLoading');
});

document.querySelectorAll('.loading').forEach((element) => {
    element.classList.add('hideLoaders');
});
  return chatResponse; 
}

sendMessageToChatGPT()
getStyleFromChatGPT()

};
