import React, { useState, useEffect } from "react";
import {
    Box,
    Avatar,
    Text,
    IconButton,
    useDisclosure,
    useToast,
    Input,
    useColorModeValue,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Textarea,
    Image,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import axios from "axios";
import { ChatState } from "../Context/ChatProvider";
import StatusViewer from "./StatusViewer";

const StatusList = () => {
    const [statuses, setStatuses] = useState([]);
    const [selectedUserStatuses, setSelectedUserStatuses] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { user } = ChatState();
    const {
        isOpen: isViewerOpen,
        onOpen: onViewerOpen,
        onClose: onViewerClose,
    } = useDisclosure();
    const {
        isOpen: isCreateOpen,
        onOpen: onCreateOpen,
        onClose: onCreateClose,
    } = useDisclosure();

    const [statusText, setStatusText] = useState("");
    const [statusFile, setStatusFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const toast = useToast();

    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    // Fetch all active statuses
    const fetchStatuses = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get("/api/status", config);
            setStatuses(data);
        } catch (error) {
            console.error("Error fetching statuses:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStatuses();
            const interval = setInterval(fetchStatuses, 30000);
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line
    }, [user]);

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm"];
        if (!validTypes.includes(file.type)) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image or video",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setStatusFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    // Upload status
    const handlePostStatus = async () => {
        if (!statusFile && !statusText.trim()) {
            toast({
                title: "Empty Status",
                description: "Please add text or media",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setUploading(true);

        try {
            let mediaUrl = "";
            let mediaType = "text";

            if (statusFile) {
                const formData = new FormData();
                formData.append("file", statusFile);
                formData.append("upload_preset", "chat-hub");
                formData.append("cloud_name", "dyjnlh1ef");

                const isVideo = statusFile.type.startsWith("video");
                const uploadUrl = isVideo
                    ? "https://api.cloudinary.com/v1_1/dyjnlh1ef/video/upload"
                    : "https://api.cloudinary.com/v1_1/dyjnlh1ef/image/upload";

                const uploadResponse = await axios.post(uploadUrl, formData);
                mediaUrl = uploadResponse.data.secure_url;
                mediaType = isVideo ? "video" : "image";
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    "Content-Type": "application/json",
                },
            };

            await axios.post(
                "/api/status",
                {
                    mediaUrl,
                    mediaType,
                    caption: statusText,
                },
                config
            );

            toast({
                title: "Status posted!",
                status: "success",
                duration: 2000,
                isClosable: true,
            });

            fetchStatuses();
            handleCloseCreate();
        } catch (error) {
            toast({
                title: "Error posting status",
                description: error.response?.data?.message || error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUploading(false);
        }
    };

    const handleCloseCreate = () => {
        setStatusFile(null);
        setStatusText("");
        setPreviewUrl("");
        onCreateClose();
    };

    const handleViewStatus = (userStatuses) => {
        setSelectedUserStatuses(userStatuses);
        onViewerOpen();
    };

    const myStatus = statuses.find((s) => s.user._id === user._id);
    const totalViews = myStatus?.statuses.reduce((acc, curr) => acc + curr.views.length, 0) || 0;

    return (
        <Box
            bg={bgColor}
            borderBottom="1px"
            borderColor={borderColor}
            p={3}
            overflowX="auto"
            css={{
                "&::-webkit-scrollbar": { height: "4px" },
                "&::-webkit-scrollbar-thumb": { background: "#888", borderRadius: "4px" },
            }}
        >
            <Box display="flex" gap={3} alignItems="center">
                {/* My Status */}
                <Box textAlign="center" cursor="pointer" position="relative">
                    <Box position="relative" onClick={() => myStatus && handleViewStatus(myStatus)}>
                        <Avatar
                            size="lg"
                            name={user.name}
                            src={user.pic}
                            border={myStatus ? "3px solid #25D366" : "none"}
                        />
                        <IconButton
                            icon={<AddIcon />}
                            size="xs"
                            colorScheme="green"
                            borderRadius="full"
                            position="absolute"
                            bottom="0"
                            right="0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCreateOpen();
                            }}
                            isLoading={uploading}
                        />
                        {totalViews > 0 && (
                            <Box
                                position="absolute"
                                top="0"
                                right="0"
                                bg="blue.500"
                                color="white"
                                borderRadius="full"
                                fontSize="xs"
                                w="20px"
                                h="20px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                border="2px solid white"
                            >
                                {totalViews}
                            </Box>
                        )}
                    </Box>
                    <Text fontSize="xs" mt={1} maxW="70px" isTruncated>
                        My Status
                    </Text>
                </Box>

                {/* Unviewed Statuses */}
                {statuses
                    .filter((s) => s.user._id !== user._id)
                    .filter((userStatus) =>
                        userStatus.statuses.some((status) =>
                            !status.views.some((view) => (view.user._id || view.user) === user._id)
                        )
                    )
                    .map((userStatus) => (
                        <Box
                            key={userStatus.user._id}
                            textAlign="center"
                            cursor="pointer"
                            onClick={() => handleViewStatus(userStatus)}
                        >
                            <Avatar
                                size="lg"
                                name={userStatus.user.name}
                                src={userStatus.user.pic}
                                border="3px solid #25D366"
                            />
                            <Text fontSize="xs" mt={1} maxW="70px" isTruncated fontWeight="bold">
                                {userStatus.user.name}
                            </Text>
                        </Box>
                    ))
                }

                {/* Viewed Statuses */}
                {statuses
                    .filter((s) => s.user._id !== user._id)
                    .filter((userStatus) =>
                        userStatus.statuses.every((status) =>
                            status.views.some((view) => (view.user._id || view.user) === user._id)
                        )
                    )
                    .map((userStatus) => (
                        <Box
                            key={userStatus.user._id}
                            textAlign="center"
                            cursor="pointer"
                            onClick={() => handleViewStatus(userStatus)}
                        >
                            <Avatar
                                size="lg"
                                name={userStatus.user.name}
                                src={userStatus.user.pic}
                                border="3px solid #CBD5E0" // Gray border for viewed
                            />
                            <Text fontSize="xs" mt={1} maxW="70px" isTruncated color="gray.500">
                                {userStatus.user.name}
                            </Text>
                        </Box>
                    ))
                }
            </Box >

            {selectedUserStatuses && (
                <StatusViewer
                    isOpen={isViewerOpen}
                    onClose={onViewerClose}
                    userStatuses={selectedUserStatuses}
                    currentUser={user}
                    onRefresh={fetchStatuses}
                />
            )}

            {/* Create Status Modal */}
            <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create Status</ModalHeader>
                    <ModalBody>
                        <Textarea
                            placeholder="Type a status..."
                            value={statusText}
                            onChange={(e) => setStatusText(e.target.value)}
                            mb={4}
                        />
                        {previewUrl && statusFile && (
                            <Box mb={4} position="relative">
                                {statusFile.type.startsWith("video") ? (
                                    <video src={previewUrl} controls style={{ width: "100%", maxHeight: "300px" }} />
                                ) : (
                                    <Image src={previewUrl} alt="Preview" maxHeight="300px" width="100%" objectFit="contain" />
                                )}
                                <IconButton
                                    icon={<AddIcon transform="rotate(45deg)" />}
                                    size="sm"
                                    colorScheme="red"
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    onClick={() => {
                                        setStatusFile(null);
                                        setPreviewUrl("");
                                    }}
                                />
                            </Box>
                        )}
                        <Input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            display={previewUrl ? "none" : "block"}
                            p={1}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={handleCloseCreate}>
                            Cancel
                        </Button>
                        <Button colorScheme="green" onClick={handlePostStatus} isLoading={uploading}>
                            Post
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box >
    );
};

export default StatusList;
