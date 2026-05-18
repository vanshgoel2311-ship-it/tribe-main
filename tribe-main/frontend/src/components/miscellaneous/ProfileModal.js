// for Profile Model in SideDrawer Component

import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  IconButton,
  Text,
  Image,
  Input,
  useToast,
  Box,
  Spinner,
} from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";
import { EditIcon } from "@chakra-ui/icons";

// Returns The Profile(image , name & email )  of Selected User
const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(user.status || "");
  const [loading, setLoading] = useState(false);
  const { user: loggedUser, setUser } = ChatState();
  const toast = useToast();

  const isOwnProfile = loggedUser && loggedUser._id === user._id;

  const handleSaveStatus = async () => {
    if (newStatus.length > 139) {
      toast({
        title: "Status too long",
        description: "Status must be 139 characters or less",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.put(
        "/api/user/status",
        { status: newStatus },
        config
      );

      // Update local user info
      const updatedUser = { ...loggedUser, status: data.status };
      setUser(updatedUser);
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));

      toast({
        title: "Status updated!",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });

      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error updating status",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "image/jpeg" || file.type === "image/png") {
      setLoading(true);
      try {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "chat-hub");
        data.append("cloud_name", "dyjnlh1ef");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dyjnlh1ef/image/upload",
          {
            method: "post",
            body: data,
          }
        );
        const result = await response.json();
        const newPicUrl = result.secure_url;

        // Update backend
        const config = {
          headers: {
            Authorization: `Bearer ${loggedUser.token}`,
            "Content-Type": "application/json",
          },
        };

        const { data: updatedUserData } = await axios.put(
          "/api/user/profile",
          { pic: newPicUrl },
          config
        );

        // Update local state
        setUser(updatedUserData);
        localStorage.setItem("userInfo", JSON.stringify(updatedUserData));

        toast({
          title: "Profile Photo Updated!",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Error uploading image",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      }
      setLoading(false);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG or PNG image",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton d={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />
      )}
      <Modal size="lg" onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent h="450px">
          <ModalHeader
            fontSize="40px"
            fontFamily="Work sans"
            d="flex"
            justifyContent="center"
          >
            {user.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            d="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box position="relative">
              <Image
                borderRadius="full"
                boxSize="150px"
                src={user.pic}
                alt={user.name}
                objectFit="cover"
              />
              {isOwnProfile && (
                <>
                  <label htmlFor="profile-pic-upload">
                    <IconButton
                      icon={loading ? <Spinner size="xs" /> : <EditIcon />}
                      size="sm"
                      borderRadius="full"
                      colorScheme="teal"
                      position="absolute"
                      bottom="5px"
                      right="5px"
                      aria-label="Change Profile Photo"
                      isLoading={loading}
                      cursor="pointer"
                      as="span"
                    />
                  </label>
                  <Input
                    type="file"
                    id="profile-pic-upload"
                    accept="image/jpeg, image/png"
                    onChange={handleImageUpload}
                    display="none"
                  />
                </>
              )}
            </Box>
            <Text
              fontSize={{ base: "28px", md: "30px" }}
              fontFamily="Work sans"
            >
              Email: {user.email}
            </Text>

            {/* Status Section */}
            <Box w="100%" px={4}>
              {isEditing ? (
                <>
                  <Input
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    placeholder="Enter your status"
                    maxLength={139}
                    mb={2}
                  />
                  <Text fontSize="xs" color="gray.500" textAlign="right">
                    {newStatus.length}/139
                  </Text>
                </>
              ) : (
                <Text
                  fontSize={{ base: "16px", md: "18px" }}
                  fontFamily="Work sans"
                  fontStyle="italic"
                  color="gray.500"
                  textAlign="center"
                >
                  {user.status || "Hey there! I am using Tribe"}
                </Text>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            {isOwnProfile && (
              <>
                {isEditing ? (
                  <>
                    <Button onClick={() => setIsEditing(false)} mr={2}>
                      Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleSaveStatus}>
                      Save
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} mr={2}>
                    Edit Status
                  </Button>
                )}
              </>
            )}
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;

