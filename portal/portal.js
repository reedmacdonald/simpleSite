window.onload = function () {
  console.log("YOU are in the portal");
  const factsButton = document.querySelector("#getFactsButton");
  const factsList = document.querySelector("#factsList");
  const addFactsButton = document.querySelector("#addFactsButton");
  const deleteFactsButton = document.querySelector("#deleteFactsButton");
  const hideFactsButton = document.querySelector("#hideFactsButton");
  const inputBox = document.querySelector("#inputBox");
  const inputBoxInput = document.querySelector("#inputBoxInput");
  const submitFactButton = document.querySelector("#submitFactButton");
  const portalEnterBtn = document.getElementById("portal-enter");
  const portalPassInput = document.getElementById("portal-pass");
  const portalGate = document.getElementById("portal-gate");
  const portalMsg = document.getElementById("portal-msg");

  if (portalEnterBtn && portalPassInput && portalGate) {
    const tryUnlock = () => {
      const val = portalPassInput.value || "";
      if (val === "passwordmock") {
        // success: remember for this tab/session and hide overlay
        sessionStorage.setItem("portal_ok_v1", "1");
        portalGate.style.display = "none";
        portalMsg.style.display = "none";
      } else {
        // failure: show message and clear input
        if (portalMsg) portalMsg.style.display = "block";
        portalPassInput.value = "";
        portalPassInput.focus();
      }
    };

    portalEnterBtn.addEventListener("click", tryUnlock);

    portalPassInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryUnlock();
    });

    // auto-hide if already unlocked in this session
    if (sessionStorage.getItem("portal_ok_v1") === "1") {
      portalGate.style.display = "none";
    }
  }

  function animateLi(li, delayMs = 0) {
    // Ensure the element is in the DOM before toggling the class
    if (delayMs) {
      setTimeout(() => li.classList.add("show"), delayMs);
    } else {
      requestAnimationFrame(() => li.classList.add("show"));
    }
  }

  factsButton.addEventListener("click", () => {
    factsList.classList.add("visible");
    getFacts();
  });

  hideFactsButton.addEventListener("click", () => {
    factsList.classList.remove("visible");
  });

  let inputShown = false;
  addFactsButton.addEventListener("click", () => {
    if (inputShown) {
      inputShown = false;
      inputBox.classList.add("visible");
    } else {
      inputShown = true;
      inputBox.classList.remove("visible");
    }
  });

  async function deleteFact(id) {
    try {
      const response = await fetch(reedChatUrl("reedchat-2"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          httpMethod: "DELETE",
          id,
          pathParameters: { id: id },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete fact with ID ${id}`);
      }

      console.log(`✅ Fact ${id} deleted successfully`);
    } catch (err) {
      console.error("❌ Error deleting fact:", err);
    }
  }

  submitFactButton.addEventListener("click", async () => {
    let newFact = inputBoxInput.value;
    let body = {
      httpMethod: "POST",
      answer: newFact,
      question: "idk",
      id: String(Math.floor(Math.random() * 1000000000) + 1),
    };
    const response = await fetch(
      reedChatUrl("reedchat-2"),
      reedChatApiStuff(body)
    );
    if (!response.ok) {
      throw new Error("Failed to get response from server.");
    }
    const data = await response.json();
    inputBoxInput.value = "";
    await getFacts();
  });

  deleteFactsButton.addEventListener("click", async () => {
    //factsList.classList.add("visible");
    //await getFacts();
    const listItems = factsList.querySelectorAll("li");
    let showX = false;
    if (!showX) {
      listItems.forEach(async (li) => {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "x";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.style.cursor = "pointer";

        // Add click event to remove the li
        deleteBtn.addEventListener("click", async () => {
          const id = li.dataset.id; // get the fact's ID
          console.log(`Deleting item with id: ${id}`);
          li.remove(); // remove the li from the DOM
          await deleteFact(id);
          // Optionally, call your API here to delete from DynamoDB
          // deleteFact(id);
        });

        // Append the button to the li
        li.appendChild(deleteBtn);
      });
      showX = true;
    } else {
      const deleteButtons = factsList.querySelectorAll("button");

      deleteButtons.forEach((btn) => {
        btn.remove(); // removes the button, keeps the <li> intact
      });
    }
  });

  const reedChatApiStuff = (body) => {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      httpMethod: "GET",
      body: JSON.stringify(body),
    };
  };
  const reedChatUrl = (endpoint) =>
    `https://ut8byjwxf4.execute-api.us-west-1.amazonaws.com/prod/${endpoint}`;

  async function getFacts() {
    const body = { httpMethod: "GET" };
    const response = await fetch(
      reedChatUrl("reedchat-2"),
      reedChatApiStuff(body)
    );
    if (!response.ok) throw new Error("Failed to get response from server.");

    const data = await response.json();

    // Clear existing items (and their animation state)
    factsList.innerHTML = "";

    // Populate and animate with a light stagger (40ms * index)
    data.forEach((fact, i) => {
      const li = document.createElement("li");

      // NOTE: adjust the field names below to match your DynamoDB shape
      // You used fact.answer.S in your code; if your item has an `id`, prefer that:
      // li.dataset.id = fact.id?.S || fact.answer?.S;
      li.textContent = fact.answer?.S || "";
      li.dataset.id = fact.id?.S || fact.answer?.S || ""; // fallbacks to avoid undefined

      factsList.appendChild(li);
      animateLi(li, 40 * (i + 1)); // staggered fade-in
    });
  }
};
