import { useState } from "react";
import {
  Input,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Container,
  Icon,
  IconButton,
  Select,
  VStack,
  FormControl,
  FormLabel,
  useColorModeValue,
} from "@chakra-ui/react";
import { Bot, XCircle } from "lucide-react";

const apiUrl = process.env.REACT_APP_CONTENT_TYPE;
const rapidAPIKey = process.env.REACT_APP_X_RAPIDAPI_KEY;
const rapidAPIHost = process.env.REACT_APP_X_RAPIDAPI_HOST;

const ChatbotModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userMessage, setUserMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("Gemini");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const chatbox = document.querySelector(".chatbox");

  const bgColor = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("black", "white");

  const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent =
      className === "outgoing"
        ? `<p></p>`
        : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
  };

  const handleChat = async () => {
    const userMessageValue = userMessage.trim();
    if (!userMessageValue) return;

    if (!apiKey) {
      alert("Please enter an API Key for the selected model.");
      return;
    }

    // Append user message
    const outgoingChatLi = createChatLi(userMessageValue, "outgoing");
    chatbox.appendChild(outgoingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setUserMessage("");

    // Append "Thinking..." message
    const incomingChatLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setLoading(true);

    try {
      let responseText = "Error: Could not get response.";

      if (selectedModel === "Gemini") {
        responseText = await callGeminiAPI(userMessageValue);
      } else if (selectedModel === "GPT") {
        responseText = await callGPTAPI(userMessageValue);
      } else if (selectedModel === "Claude") {
        responseText = await callClaudeAPI(userMessageValue);
      } else if (selectedModel === "Qwen") {
        responseText = await callQwenAPI(userMessageValue);
      }

      incomingChatLi.querySelector("p").textContent = responseText;
    } catch (error) {
      incomingChatLi.querySelector("p").textContent = "Error: " + error.message;
      incomingChatLi.querySelector("p").classList.add("error");
    } finally {
      setLoading(false);
      chatbox.scrollTo(0, chatbox.scrollHeight);
    }
  };

  // --- API Functions ---

  async function callGeminiAPI(query) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: query }] }] }),
    };
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
  }

  async function callGPTAPI(query) {
    const url = "https://api.openai.com/v1/chat/completions";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: query }],
      }),
    };
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }

  async function callClaudeAPI(query) {
    // Note: Claude API often has CORS issues from browser.
    // Using a proxy or backend is recommended for production.
    const url = "https://api.anthropic.com/v1/messages";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "dangerously-allow-browser": "true", // Only for dev/testing if supported by their SDK, raw fetch might still block
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: [{ role: "user", content: query }],
      }),
    };

    // Attempting fetch, but might fail due to CORS
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.content[0].text;
    } catch (e) {
      throw new Error("Claude API failed (likely CORS). Backend proxy required.");
    }
  }

  async function callQwenAPI(query) {
    // Using Hugging Face Inference API for Qwen
    const url = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ inputs: query }),
    };
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    // HF Inference API returns array of results or object depending on task
    return data[0]?.generated_text || JSON.stringify(data);
  }
  return (
    <>
      <div>
        <IconButton
          backgroundColor={"#724ae8"}
          borderRadius={"50"}
          justifyContent={"center"}
          alignItems={"center"}
          onClick={onOpen}
          _hover={{ backgroundColor: "#5372f0" }}
        >
          {!isOpen ? (
            <Bot color="white" size={24} />
          ) : (
            <XCircle color="white" size={20} />
          )}
        </IconButton>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader
              backgroundColor="#5372f0"
              textAlign={"center"}
              fontSize={24}
              fontWeight={700}
            >
              Chat Bot
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody marginTop={2}>
              {/* Settings Area */}
              <VStack spacing={3} mb={4} p={3} bg={bgColor} borderRadius="md">
                <FormControl>
                  <FormLabel fontSize="sm" mb={1} color={textColor}>Select AI Model</FormLabel>
                  <Select
                    size="sm"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    bg={inputBg}
                    color={textColor}
                  >
                    <option value="Gemini" style={{ color: "black" }}>Gemini (Google)</option>
                    <option value="GPT" style={{ color: "black" }}>GPT (OpenAI)</option>
                    <option value="Claude" style={{ color: "black" }}>Claude (Anthropic)</option>
                    <option value="Qwen" style={{ color: "black" }}>Qwen (Hugging Face)</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={1} color={textColor}>API Key</FormLabel>
                  <Input
                    size="sm"
                    type="password"
                    placeholder={`Enter ${selectedModel} API Key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    bg={inputBg}
                    color={textColor}
                  />
                </FormControl>
              </VStack>
              <ul class="chatbox">
                <li class="chat incoming">
                  <span class="material-symbols-outlined">smart_toy</span>
                  <p>
                    Hi there 👋
                    <br />
                    How can I help you today?
                  </p>
                </li>
              </ul>
              <div class="chat-input">
                <Input
                  marginTop={10}
                  marginBottom={2}
                  placeholder="Ask me anything..."
                  spellCheck={false}
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                />
              </div>
              <Container justifyContent={"right"} display="flex">
                <Button
                  marginTop={2}
                  colorScheme="blue"
                  mr={3}
                  onClick={handleChat}
                  justifyContent="center"
                >
                  Ask
                </Button>
              </Container>
            </ModalBody>

            <ModalFooter></ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </>
  );
};

export default ChatbotModal;
