const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Constants for sender types
const SENDER_USER = 'user';
const SENDER_BOT = 'bot';
const TYPING_INDICATOR_ID = 'typing-indicator';

// Function to handle the form submission
async function handleFormSubmit(event) {
  event.preventDefault(); // Prevent default form submission

  const userMessage = input.value.trim();
  if (!userMessage) return; // Do nothing if the message is empty

  appendMessage(SENDER_USER, userMessage);
  input.value = ''; // Clear the input field

  setFormDisabled(true);
  showTypingIndicator();

  try {
    // Send message to the backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });
    // Check if the HTTP response is ok
    if (!response.ok) {
      // Try to parse error message from backend if available
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If parsing error fails, stick to the original HTTP error
        console.warn('Could not parse error response JSON:', e);
      }
      throw new Error(errorMessage);
    }

    // Parse the JSON response from the backend
    const data = await response.json();

    // Check if the response structure is as expected
    if (data.status === 'success' && data.data && data.data.result) {
      appendMessage(SENDER_BOT, data.data.result);
    } else {
      // Handle unexpected response structure
      appendMessage(SENDER_BOT, 'Sorry, I received an unexpected response from the server.');
      console.error('Unexpected response format:', data);
    }
  } catch (error) {
    // Handle network errors or errors thrown from the try block
    console.error('Error fetching chat response:', error);
    appendMessage(SENDER_BOT, error.message || 'Sorry, something went wrong. Please try again.');
  } finally {
    removeTypingIndicator(); // Temporarily comment this out for debugging
    setFormDisabled(false);
    input.focus(); // Optionally refocus the input field
  }
}

// Add event listener to the form
form.addEventListener('submit', handleFormSubmit);

function setFormDisabled(disabled) {
  input.disabled = disabled;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = disabled;
  }
}

function showTypingIndicator() {
  // Avoid adding multiple indicators
  if (document.getElementById(TYPING_INDICATOR_ID)) return;

  const indicator = document.createElement('div');
  indicator.id = TYPING_INDICATOR_ID;
  indicator.classList.add('message', SENDER_BOT, 'typing-indicator'); // Style it like a bot message
  // Use innerHTML to allow for spans for animated dots
  indicator.innerHTML = `
    <div class="spinner"></div>
    <span>Gemini is thinking</span>
    <span class="dot">.</span>
    <span class="dot">.</span>
    <span class="dot">.</span>`;
  chatBox.appendChild(indicator);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById(TYPING_INDICATOR_ID);
  if (indicator) {
    indicator.remove();
  }
}

async function appendMessage(sender, text, delay = 5) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Tampilkan karakter satu per satu (tanpa markdown dulu)
  let plainText = text;
  let currentText = '';

  if (sender === SENDER_BOT) {
    for (let i = 0; i < plainText.length; i++) {
      currentText += plainText[i];
      msg.textContent = currentText;
      chatBox.scrollTop = chatBox.scrollHeight;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Setelah selesai ngetik, konversi ke HTML (Markdown ke HTML)
  msg.innerHTML = convertMarkdownToHTML(plainText);
  chatBox.scrollTop = chatBox.scrollHeight;
}
function convertMarkdownToHTML(text) {
  if (!text) return '';

  // Ganti **text** jadi <b>text</b>
  text = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  // Ganti *text* jadi <i>text</i>
  text = text.replace(/\*(.+?)\*/g, '<b>$1</b>');

  return text;
}

function appendTypingText(element, text, delay = 50) {
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      element.innerHTML += text[i++];
    } else {
      clearInterval(interval);
    }
  }, delay);
}