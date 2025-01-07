window.onload = function () {
  async function sendMessageToChatGPT() {
    const response = await fetch('https://9izl1e71m2.execute-api.us-west-1.amazonaws.com/prod/chatgpt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Hello, ChatGPT!' }),
    });

    if (!response.ok) {
        throw new Error('Failed to get response from server.');
    }

    const data = await response.json();
    let chatResponse = data.choices[0].message.content
    chatResponse = chatResponse.replace(/"/g, '');
    document.getElementById('chatOutput').textContent = chatResponse;
    return chatResponse; 
}

sendMessageToChatGPT()

};
