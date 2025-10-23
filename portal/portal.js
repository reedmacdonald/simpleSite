window.onload = function () {
  console.log("YOU are in the portal");
  const factsButton = document.querySelector("#getFactsButton");
  const factsList = document.querySelector("#factsList");
  const inputBoxInput = document.querySelector("#inputBoxInput");
  const submitFactButton = document.querySelector("#submitFactButton");
  const portalEnterBtn = document.getElementById("portal-enter");
  const portalPassInput = document.getElementById("portal-pass");
  const portalGate = document.getElementById("portal-gate");
  const portalMsg = document.getElementById("portal-msg");
  const addInstructionButton = document.getElementById("addInstructionButton");
  const viewInstructionsButton = document.getElementById(
    "viewInstructionsButton"
  );
  // === inside window.onload, near your other DOM lookups ===
  const uploadFile = document.getElementById("uploadFile");
  const uploadDesc = document.getElementById("uploadDesc");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadStatus = document.getElementById("uploadStatus");
  const viewImagesButton = document.getElementById("viewImagesButton");

  // Optional: if you added a portal token gate
  // const PORTAL_TOKEN = 'your-shared-secret';

  function normalizeItem(raw) {
    const id = raw?.id?.S ?? raw?.id ?? "";
    const content =
      raw?.content?.S ?? raw?.answer?.S ?? raw?.description?.S ?? "";
    const url = raw?.url?.S ?? raw?.url ?? "";
    const kind = raw?.kind?.S ?? raw?.kind ?? "";
    const s3Key = raw?.s3Key?.S ?? raw?.s3Key ?? "";
    return {
      id: String(id),
      content: String(content),
      url: String(url),
      kind,
      s3Key,
    };
  }

  function renderImagesGrid(listEl, images) {
    listEl.innerHTML = "";
    images.forEach((imgItem) => {
      const li = document.createElement("li");
      li.dataset.id = imgItem.id;

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.alignItems = "center";
      left.style.gap = "12px";

      const thumb = document.createElement("img");
      thumb.src = imgItem.url;
      thumb.alt = imgItem.content || "uploaded image";
      thumb.style.maxHeight = "80px";
      thumb.style.maxWidth = "80px";
      thumb.style.objectFit = "cover";
      thumb.style.borderRadius = "6px";

      const caption = document.createElement("span");
      caption.textContent = imgItem.content || "(no description)";

      const del = document.createElement("button");
      del.textContent = "x";
      del.style.marginLeft = "10px";
      del.style.cursor = "pointer";
      del.style.color = "#ff7b72";
      del.style.background = "none";
      del.style.border = "none";

      del.addEventListener("click", async () => {
        const id = li.dataset.id;
        console.log("Deleting image id:", id);
        li.remove();
        await deleteFact(id); // your existing delete route now handles images (DDB + S3)
      });

      left.appendChild(thumb);
      left.appendChild(caption);
      li.appendChild(left);
      li.appendChild(del);
      factsList.appendChild(li);
    });
  }

  viewImagesButton?.addEventListener("click", async () => {
    try {
      const res = await fetch(
        reedChatUrl("reedchat-2"),
        reedChatApiStuff({ httpMethod: "GET" })
      );
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      console.log(data, "<----data");

      const images = data
        .map(normalizeItem)
        .filter(
          (it) => it.kind === "image" || (it.url && it.url.startsWith("http"))
        );

      renderImagesGrid(factsList, images);
      console.log(`✅ Displayed ${images.length} images`);
    } catch (e) {
      console.error("❌ Error fetching images:", e);
    }
  });

  uploadBtn?.addEventListener("click", async () => {
    try {
      const file = uploadFile.files?.[0];
      if (!file) {
        alert("Choose an image");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Only image files allowed");
        return;
      }

      uploadBtn.disabled = true;
      uploadStatus.textContent = "Requesting upload URL…";

      // 1) Ask Lambda for presigned URL + create metadata row
      const initBody = {
        httpMethod: "UPLOAD_INIT",
        fileName: file.name,
        contentType: file.type,
        description: uploadDesc.value || "",
      };

      console.log(initBody, "<-----initBody");

      const initRes = await fetch(reedChatUrl("reedchat-2"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'X-Portal-Token': PORTAL_TOKEN,
        },
        body: JSON.stringify(initBody),
      }).catch((err) => {
        console.log(err, "<----err");
      });

      if (!initRes.ok) {
        const t = await initRes.text();
        throw new Error(`Init failed ${initRes.status}: ${t}`);
      }

      const { uploadUrl, url, id } = await initRes.json();

      // 2) Upload the file directly to S3
      uploadStatus.textContent = "Uploading to S3…";
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        const t = await putRes.text();
        throw new Error(`S3 upload failed ${putRes.status}: ${t}`);
      }

      uploadStatus.textContent = "✅ Uploaded!";

      // 3) Add a preview item to the list (reusing your delete flow)
      const item = { id, content: uploadDesc.value || "(no description)" };
      appendImageLiWithDelete(factsList, item, url);

      // reset inputs
      uploadFile.value = "";
      uploadDesc.value = "";
    } catch (err) {
      console.error("Upload error:", err);
      uploadStatus.textContent = "❌ " + err.message;
    } finally {
      uploadBtn.disabled = false;
    }
  });

  // Helper: append an <li> with thumbnail + delete “x”
  function appendImageLiWithDelete(listEl, item, imgUrl) {
    const li = document.createElement("li");
    li.dataset.id = item.id;

    const textSpan = document.createElement("span");
    textSpan.textContent = item.content;

    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = "uploaded image";
    img.style.maxHeight = "64px";
    img.style.marginLeft = "12px";
    img.style.borderRadius = "6px";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "x";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.color = "#ff7b72";
    deleteBtn.style.background = "none";
    deleteBtn.style.border = "none";

    deleteBtn.addEventListener("click", async () => {
      const id = li.dataset.id;
      console.log(`Deleting image with id: ${id}`);
      li.remove();
      await deleteFact(id); // reuses your existing delete endpoint (deletes by id).
      // On the backend, make sure delete also handles kind:"image" (S3 DeleteObject + DynamoDB DeleteItem).
    });

    li.appendChild(textSpan);
    li.appendChild(img);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  }

  function appendLiWithDelete(listEl, item) {
    const li = document.createElement("li");
    li.textContent = item.content;
    console.log(item, "<---item");
    li.dataset.id = item.id; // <-- ensure data-id is the REAL id

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "x";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.color = "#ff7b72";
    deleteBtn.style.background = "none";
    deleteBtn.style.border = "none";

    deleteBtn.addEventListener("click", async () => {
      const id = li.dataset.id;
      console.log(`Deleting item with id: ${id}`);
      li.remove();
      await deleteFact(id);
    });

    li.appendChild(deleteBtn);
    factsList.appendChild(li);
  }

  const viewInstructions = async () => {
    try {
      const body = { httpMethod: "GET" };
      const response = await fetch(
        reedChatUrl("reedchat-2"),
        reedChatApiStuff(body)
      );
      if (!response.ok) throw new Error("Failed to fetch instructions.");

      const data = await response.json();

      // Normalize, keep id, filter IN Instruction: items
      const instructions = data
        .map(normalizeItem)
        .filter((it) => it.content.startsWith("Instruction: "))
        .map((it) => ({
          id: it.id,
          content: it.content.replace(/^Instruction:\s*/, ""), // strip label for display only
        }));

      factsList.innerHTML = "";
      instructions.forEach((item) => appendLiWithDelete(factsList, item));
      console.log(`✅ Displayed ${instructions.length} instructions`);
    } catch (err) {
      console.error("❌ Error fetching instructions:", err);
    }
  };

  viewInstructionsButton.addEventListener("click", viewInstructions);

  addInstructionButton.addEventListener("click", async () => {
    const newInstruction = inputBoxInput.value.trim();
    if (!newInstruction) {
      alert("Please type an instruction first!");
      return;
    }

    const instructionWithPrefix = `Instruction: ${newInstruction}`;

    const body = {
      httpMethod: "POST",
      id: String(Math.floor(Math.random() * 1000000000) + 1),
      question: "idk",
      answer: instructionWithPrefix,
    };
    console.log(body, "<----body");

    try {
      const response = await fetch(
        reedChatUrl("reedchat-2"),
        reedChatApiStuff(body)
      );
      if (!response.ok) throw new Error("Failed to add instruction.");

      console.log(`✅ Instruction added: ${instructionWithPrefix}`);
      inputBoxInput.value = "";
      await getFacts(); // reuse your fact list refresh function
      factsList.classList.remove("showing-instructions");
    } catch (err) {
      console.error("❌ Error adding instruction:", err);
    }
  });

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
    factsList.classList.remove("showing-instructions");
  });

  let inputShown = false;

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
    if (!response.ok) throw new Error("Failed to get facts from server.");

    const data = await response.json();

    // Normalize to {id, content}, then filter OUT Instruction: items
    const items = data.map(normalizeItem).filter(
      (it) =>
        !it.content.startsWith("Instruction: ") &&
        it.kind !== "image" &&
        !it.url // in case some images lack kind but have a URL
    );

    factsList.innerHTML = "";
    items.forEach((item) => appendLiWithDelete(factsList, item));
    console.log(`✅ Displayed ${items.length} facts`);
  }
};
