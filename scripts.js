window.onload = function () {
  console.log('Hello World!');
  async function sendMessageToChatGPT() {
    console.log('here2')
    const response = await fetch('https://9izl1e71m2.execute-api.us-west-1.amazonaws.com/prod/chatgpt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'no message' }),
    });

    if (!response.ok) {
        throw new Error('Failed to get response from server.');
    }

    const data = await response.json();
    console.log(data,"<---data")
    return data.choices[0].message.content; // Adjust based on the API response format.
}

// Example usage:
/*document.getElementById('sendButton').addEventListener('click', async () => {
    const userMessage = document.getElementById('userInput').value;
    try {
        const chatResponse = await sendMessageToChatGPT(userMessage);
        document.getElementById('chatOutput').textContent = chatResponse;
    } catch (error) {
        console.error(error);
        document.getElementById('chatOutput').textContent = 'Error: Unable to fetch response.';
    }
});*/
sendMessageToChatGPT()

};
