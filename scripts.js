window.onload = function () {
  const reedQuestion = document.querySelector('#reedQuestion');
  const askButton = document.querySelector('#askButton')
  const reedAnswer = document.querySelector('#reedAnswer')


const reedChatApiStuff=(questionAndAnswer)=> {
  return {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json',
  },
  body: JSON.stringify({ questionAndAnswer }),
}
}
const reedChatUrl = (endpoint)=>`https://i0j7iryuvg.execute-api.us-west-1.amazonaws.com/prod/${endpoint}`

let questionAnswerArray=[];
const addQuestionToArray=()=>{
  let question=reedQuestion.value;
  questionAnswerArray.push({ role: "user", content:question })
}
const addAnswerToArray=()=>{
  let answer=reedAnswer.innerHTML.replace(/^Answer:\s*/, '');
  questionAnswerArray.push({
    role:"assistant",
    content: answer
  })
}



async function getBio(questionAndAnswer){
  reedAnswer.innerText = "Getting a response...";
  reedQuestion.value = '';
  askButton.setAttribute("disabled","true");
  const response = await fetch(reedChatUrl('reedchat'), reedChatApiStuff(questionAndAnswer));

  if (!response.ok) {
      throw new Error('Failed to get response from server.');
  }

  const data = await response.json();
  const answer = data.choices[0].message.content
  reedAnswer.innerText = "Answer: " + answer;
}


//sendMessageToChatGPT()
//getStyleFromChatGPT()
askButton.addEventListener('click',()=>{
  if(reedAnswer.innerHTML){
    addAnswerToArray()
    addQuestionToArray()
  }else{
    addQuestionToArray()
  }
  getBio(questionAnswerArray)
})


askButton.addEventListener('keypress', function (event) {
  if (event.key === 'Enter' && reedQuestion.value.trim().length>0) {
    if(reedAnswer.innerHTML){
      addAnswerToArray()
      addQuestionToArray()
    }else{
      addQuestionToArray()
    }
    getBio(questionAnswerArray)
  }
});




reedQuestion.addEventListener('input',()=>{
  if(reedQuestion.value.trim().length>0){
    askButton.removeAttribute("disabled");
  }else{
    askButton.setAttribute("disabled","true")
  }
})

//getBio()

};
