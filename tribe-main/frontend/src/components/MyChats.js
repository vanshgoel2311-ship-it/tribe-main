import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { useEffect, useState } from "react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { Button, useColorModeValue, Avatar } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";

// fetchAgain is the parent state & is responsiple to update user lists in Mychats
const MyChats = ({ fetchAgain }) => {
  // local state
  const [loggedUser, setLoggedUser] = useState();

  const { selectedChat, setSelectedChat, user, chats, setChats, notification, setNotification } = ChatState();

  const bgUnselected = useColorModeValue("#fefeff", "gray.700");
  const colorUnselected = useColorModeValue("black", "white");

  const toast = useToast();

  const fetchChats = async () => {
    try {
      // jwt token
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <Box
      // for responsive chat
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg={useColorModeValue("#fefeff", "black")}
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
    // position={"relative"}
    // zIndex={1}
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        Chats
        {/* Modal For Group Chat */}
        <GroupChatModal>
          <Button
            // overflow={"hidden"}
            display="flex"
            // position={"relative"}
            fontSize={{ base: "17px", md: "10px", lg: "17px" }}
            rightIcon={<AddIcon />}
            // bg="#9cacf5"
            bg="#724ae8"
            color={"white"}
          // colorScheme="pink"
          // zIndex={"1"}
          // zIndex={1}
          >
            New Group
          </Button>
        </GroupChatModal>
      </Box>
      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg={useColorModeValue("white", "black")}
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => (
              <Box
                fontWeight="700"
                onClick={() => {
                  setSelectedChat(chat);
                  setNotification(notification.filter((n) => n.chat._id !== chat._id));
                }}
                cursor="pointer"
                bg={selectedChat === chat ? "#724ae8" : bgUnselected}
                color={selectedChat === chat ? "white" : colorUnselected}
                px={3}
                py={2}
                borderRadius="20px"
                key={chat._id}
                display="flex"
                alignItems="center"
              >
                {/* Avatar */}
                <Avatar
                  size="sm"
                  mr={2}
                  name={
                    !chat.isGroupChat
                      ? getSender(loggedUser, chat.users)
                      : chat.chatName
                  }
                  src={
                    !chat.isGroupChat
                      ? getSenderFull(loggedUser, chat.users).pic
                      : undefined
                  }
                />

                <Box flex="1">
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Text>
                      {!chat.isGroupChat
                        ? getSender(loggedUser, chat.users)
                        : chat.chatName}
                    </Text>
                    {notification.filter((n) => n.chat._id === chat._id).length > 0 && (
                      <Box
                        bg="red.500"
                        color="white"
                        borderRadius="full"
                        px={2}
                        fontSize="xs"
                      >
                        +{notification.filter((n) => n.chat._id === chat._id).length}
                      </Box>
                    )}
                  </Box>
                  {chat.latestMessage && (
                    <Text fontSize="xs" isTruncated maxW="200px">
                      <b>{chat.latestMessage.sender.name} : </b>
                      {chat.latestMessage.content.length > 50
                        ? chat.latestMessage.content.substring(0, 51) + "..."
                        : chat.latestMessage.content}
                    </Text>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
