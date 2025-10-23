window.onload = function () {
  const reedQuestion = document.querySelector("#reedQuestion");
  const askButton = document.querySelector("#askButton");
  const reedAnswer = document.querySelector("#reedAnswer");

  const reedChatApiStuff = (questionAndAnswer) => {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionAndAnswer }),
    };
  };
  const reedChatUrl = (endpoint) =>
    `https://i0j7iryuvg.execute-api.us-west-1.amazonaws.com/prod/${endpoint}`;

  let questionAnswerArray = [];
  const addQuestionToArray = () => {
    let question = reedQuestion.value;
    questionAnswerArray.push({ role: "user", content: question });
  };
  const addAnswerToArray = () => {
    let answer = reedAnswer.innerHTML.replace(/^Answer:\s*/, "");
    questionAnswerArray.push({
      role: "assistant",
      content: answer,
    });
  };

  async function getBio(questionAndAnswer) {
    try {
      reedAnswer.innerText = "Getting a response...";
      reedQuestion.value = "";
      askButton.setAttribute("disabled", "true");

      console.log("Sending request to:", reedChatUrl("reedchat"));
      console.log("Request payload:", questionAndAnswer);

      const response = await fetch(
        reedChatUrl("reedchat"),
        reedChatApiStuff(questionAndAnswer)
      );

      if (!response.ok) {
        console.error(
          "Server returned non-OK response:",
          response.status,
          response.statusText
        );
        throw new Error("Failed to get response from server.");
      }

      const data = await response.json();
      console.log("Full response data:", data);

      const answer = data.choices[0].message.content;
      const raw = data.choices[0].message.content || "";
      const imageMatch = raw.match(/^IMAGE:\s*(\S+)/m);
      if (imageMatch) {
        const imgUrl = imageMatch[1];

        const altText = imageMatch ? imageMatch[1].trim() : "related image";

        // Insert image above the answer (or wherever you like)
        const img = document.createElement("img");
        img.src = imgUrl;
        img.alt = altText;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.margin = "8px 0";
        reedAnswer.after(img);

        // Optionally strip the IMAGE line from the text we show
        const cleaned = raw.replace(/^IMAGE:.*\n?/, "");
        reedAnswer.innerText = "Answer: " + cleaned.trim();
      } else {
        reedAnswer.innerText = "Answer: " + raw;
      }
    } catch (error) {
      console.error("Error in getBio:", error);
      reedAnswer.innerText = "⚠️ Error: " + error.message;
    } finally {
      askButton.removeAttribute("disabled");
    }
  }

  //sendMessageToChatGPT()
  //getStyleFromChatGPT()
  askButton.addEventListener("click", () => {
    if (reedAnswer.innerHTML) {
      addAnswerToArray();
      addQuestionToArray();
    } else {
      addQuestionToArray();
    }
    getBio(questionAnswerArray);
  });

  askButton.addEventListener("keypress", function (event) {
    if (event.key === "Enter" && reedQuestion.value.trim().length > 0) {
      if (reedAnswer.innerHTML) {
        addAnswerToArray();
        addQuestionToArray();
      } else {
        addQuestionToArray();
      }
      getBio(questionAnswerArray);
    }
  });

  reedQuestion.addEventListener("input", () => {
    if (reedQuestion.value.trim().length > 0) {
      askButton.removeAttribute("disabled");
    } else {
      askButton.setAttribute("disabled", "true");
    }
  });

  //getBio()
};
