import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed"; // NPM package for Scrollable feed
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import { Button, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, useToast, Box, IconButton } from "@chakra-ui/react";
import { ExternalLinkIcon, DeleteIcon } from "@chakra-ui/icons";
import axios from "axios";

const ScrollableChat = ({ messages, isSelectionMode, selectedMessages, toggleMessageSelection, onDeleteMessage }) => {
  const { user, selectedChat, setSelectedChat } = ChatState();
  const toast = useToast();

  const bgUser = useColorModeValue("#7c93f6", "#7c93f6");
  const bgOther = useColorModeValue("#f8f9fd", "#23272A"); // Explicit dark hex
  const colorUser = "white";
  const colorOther = useColorModeValue("black", "white");
  const iconColor = useColorModeValue("black", "white");

  function wordFoundInString(inputString, targetWord) {
    const lowerCaseInput = inputString.toLowerCase();
    const lowerCaseWord = targetWord.toLowerCase();

    return lowerCaseInput.includes(lowerCaseWord);
  }
  function wordNotFoundInString(inputString, targetWord) {
    const lowerCaseInput = inputString.toLowerCase();
    const lowerCaseWord = targetWord.toLowerCase();

    return !lowerCaseInput.includes(lowerCaseWord);
  }



  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex" }} key={m._id}>
            {/* While Mapping pass a key value */}
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
                <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender.name}
                    src={m.sender.pic}
                  />
                </Tooltip>
              )}

            {/* render messages */}
            <span
              style={{
                backgroundColor: `${m.sender._id === user._id ? bgUser : bgOther
                  }`,
                color: `${m.sender._id === user._id ? colorUser : colorOther}`,
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                borderRadius: "20px",
                border: "1px solid ",
                padding: "5px 15px",
                maxWidth: "75%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                cursor: isSelectionMode ? "pointer" : "default",
                border: isSelectionMode && selectedMessages.includes(m._id) ? "2px solid #38B2AC" : "1px solid transparent",
                opacity: isSelectionMode && !selectedMessages.includes(m._id) ? 0.7 : 1,
              }}
              onClick={() => isSelectionMode && toggleMessageSelection(m._id)}
            >
              {isSelectionMode && (
                <Box position="absolute" top="-10px" left="-10px" zIndex={2}>
                  {selectedMessages.includes(m._id) ? (
                    <Box bg="teal.500" borderRadius="full" p={1}>
                      <DeleteIcon color="white" w={3} h={3} />
                    </Box>
                  ) : (
                    <Box bg="gray.300" borderRadius="full" w={5} h={5} border="2px solid white" />
                  )}
                </Box>
              )}

              {/* Delete button for individual messages (user's own messages only, when not in selection mode) */}
              {!isSelectionMode && m.sender._id === user._id && (
                <IconButton
                  icon={<DeleteIcon />}
                  size="xs"
                  position="absolute"
                  top="2px"
                  right="2px"
                  colorScheme="red"
                  variant="ghost"
                  aria-label="Delete message"
                  opacity={0}
                  _hover={{ opacity: 1 }}
                  _groupHover={{ opacity: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMessage(m._id);
                  }}
                  zIndex={3}
                  className="delete-message-btn"
                />
              )}

              {/* Message content */}
              {/* Render voice note, GIF, or regular message */}
              {m.content.startsWith('[VOICE_NOTE]') ? (
                <>
                  🎤 Voice Note
                  <audio
                    controls
                    style={{
                      width: '250px',
                      height: '35px',
                      marginTop: '5px',
                      borderRadius: '20px'
                    }}
                  >
                    <source src={m.content.replace('[VOICE_NOTE]', '')} type="audio/webm" />
                    <source src={m.content.replace('[VOICE_NOTE]', '')} type="audio/mp3" />
                    Your browser does not support audio playback.
                  </audio>
                </>
              ) : m.content.startsWith('[GIF]') ? (
                <img
                  src={m.content.replace('[GIF]', '')}
                  alt="GIF"
                  style={{
                    borderRadius: "10px",
                    marginTop: "5px",
                    maxWidth: "100%",
                    maxHeight: "200px"
                  }}
                />
              ) : (
                <>
                  {wordNotFoundInString(m.content, "http://res.cloudinary.com")
                    ? m.content
                    : "Photo"}
                </>
              )}

              {/* Show external link button for images (not voice notes) */}
              {wordFoundInString(m.content, "http://res.cloudinary.com") &&
                !m.content.startsWith('[VOICE_NOTE]') && (
                  <Button
                    size="md"
                    colorScheme=""
                    key={m._id}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(`${m.content}`, "_blank");
                    }}
                  >
                    <ExternalLinkIcon color={iconColor} />
                  </Button>
                )}
              <span
                style={{
                  fontSize: "0.65rem",
                  color: m.sender._id === user._id ? "#e0e0e0" : "#718096",
                  display: "block",
                  textAlign: "right",
                  marginTop: "2px",
                  marginBottom: "-2px",
                }}
              >
                {/* Timestamp for all messages */}
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
            {/* Read Receipt Label for outgoing messages */}
            {
              m.sender._id === user._id && m.readBy && m.readBy.length > 0 && (
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: "gray",
                    marginTop: "2px",
                    marginLeft: "2px",
                    alignSelf: "flex-end",
                  }}
                >
                  {`Read ${new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
                </div>
              )
            }
          </div>
        ))
      }
    </ScrollableFeed >
  );
};

export default ScrollableChat;
