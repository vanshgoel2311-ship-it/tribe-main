import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Box,
    Image,
    Avatar,
    Text,
    IconButton,
    Progress,
    useToast,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
} from "@chakra-ui/react";
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, DeleteIcon } from "@chakra-ui/icons";
import { MoreVertical } from "lucide-react";
import axios from "axios";

const StatusViewer = ({ isOpen, onClose, userStatuses, currentUser, onRefresh }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isViewersOpen, setViewersOpen] = useState(false);
    const toast = useToast();

    const statuses = userStatuses?.statuses || [];
    const currentStatus = statuses[currentIndex];

    const getTimeString = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return "Just now";
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
        }

        return date.toLocaleDateString();
    };

    useEffect(() => {
        if (!isOpen || !currentStatus) return;

        // Mark as viewed
        markViewed(currentStatus._id);

        // Auto-advance timer (5 seconds for images, 30 for videos)
        const duration = currentStatus.mediaType === "video" ? 30000 : 5000;
        const interval = 50; // Update progress every 50ms
        const incrementValue = (100 / duration) * interval;

        setProgress(0);
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + incrementValue;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, isOpen, currentStatus]);

    const markViewed = async (statusId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${currentUser.token}`,
                },
            };
            await axios.put(`/api/status/${statusId}/view`, {}, config);
            onRefresh();
        } catch (error) {
            console.error("Error marking status as viewed:", error);
        }
    };

    const handleNext = () => {
        if (currentIndex < statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            onClose();
            setCurrentIndex(0);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    };

    const handleDelete = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${currentUser.token}`,
                },
            };

            await axios.delete(`/api/status/${currentStatus._id}`, config);

            toast({
                title: "Status deleted",
                status: "success",
                duration: 2000,
                isClosable: true,
            });

            onRefresh();
            onClose();
        } catch (error) {
            toast({
                title: "Error deleting status",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    if (!currentStatus) return null;

    const isOwnStatus = userStatuses.user._id === currentUser._id;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
            <ModalOverlay bg="blackAlpha.900" />
            <ModalContent bg="black" m={0} borderRadius={0}>
                {/* Progress bars */}
                <Box position="absolute" top={0} left={0} right={0} p={2} zIndex={2}>
                    <Box display="flex" gap={1}>
                        {statuses.map((_, index) => (
                            <Progress
                                key={index}
                                value={index === currentIndex ? progress : index < currentIndex ? 100 : 0}
                                size="xs"
                                colorScheme="whiteAlpha"
                                flex={1}
                                bg="whiteAlpha.300"
                            />
                        ))}
                    </Box>
                </Box>

                {/* Header */}
                <Box
                    position="absolute"
                    top={12}
                    left={0}
                    right={0}
                    p={4}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    bg="linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)"
                    zIndex={2}
                >
                    <Box display="flex" alignItems="center" gap={3}>
                        <Avatar size="sm" name={userStatuses.user.name} src={userStatuses.user.pic} />
                        <Box>
                            <Text color="white" fontWeight="bold">
                                {userStatuses.user.name}
                            </Text>
                            <Text color="whiteAlpha.700" fontSize="xs">
                                {getTimeString(currentStatus.createdAt)}
                            </Text>
                        </Box>
                    </Box>
                    <Box>
                        {isOwnStatus && (
                            <Menu>
                                <MenuButton
                                    as={IconButton}
                                    icon={<MoreVertical color="white" />}
                                    variant="ghost"
                                    colorScheme="whiteAlpha"
                                    size="sm"
                                    mr={2}
                                />
                                <MenuList minW="150px" bg="gray.800" borderColor="gray.700">
                                    <MenuItem
                                        icon={<DeleteIcon />}
                                        onClick={handleDelete}
                                        color="red.400"
                                        bg="transparent"
                                        _hover={{ bg: "whiteAlpha.200" }}
                                    >
                                        Delete
                                    </MenuItem>
                                </MenuList>
                            </Menu>
                        )}
                        <IconButton
                            icon={<CloseIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="whiteAlpha"
                            onClick={onClose}
                        />
                    </Box>
                </Box>

                {/* Media */}
                <Box
                    height="100vh"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    position="relative"
                >
                    {currentStatus.mediaType === "text" ? (
                        <Box
                            w="100%"
                            h="100%"
                            bg="teal.500"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            p={8}
                        >
                            <Text color="white" fontSize="2xl" textAlign="center" fontWeight="bold">
                                {currentStatus.caption}
                            </Text>
                        </Box>
                    ) : currentStatus.mediaType === "image" ? (
                        <Image
                            src={currentStatus.mediaUrl}
                            alt="Status"
                            maxH="100%"
                            maxW="100%"
                            objectFit="contain"
                        />
                    ) : (
                        <video
                            src={currentStatus.mediaUrl}
                            controls
                            autoPlay
                            style={{ maxHeight: "100%", maxWidth: "100%" }}
                        />
                    )}

                    {/* Navigation arrows */}
                    {currentIndex > 0 && (
                        <IconButton
                            icon={<ChevronLeftIcon boxSize={8} />}
                            position="absolute"
                            left={4}
                            top="50%"
                            transform="translateY(-50%)"
                            colorScheme="whiteAlpha"
                            onClick={handlePrev}
                            zIndex={2}
                        />
                    )}
                    {currentIndex < statuses.length - 1 && (
                        <IconButton
                            icon={<ChevronRightIcon boxSize={8} />}
                            position="absolute"
                            right={4}
                            top="50%"
                            transform="translateY(-50%)"
                            colorScheme="whiteAlpha"
                            onClick={handleNext}
                            zIndex={2}
                        />
                    )}
                </Box>

                {/* Caption */}
                {currentStatus.caption && currentStatus.mediaType !== "text" && (
                    <Box
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        p={4}
                        bg="linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)"
                    >
                        <Text color="white" textAlign="center">
                            {currentStatus.caption}
                        </Text>
                    </Box>
                )}

                {/* View count for own status */}
                {isOwnStatus && (
                    <Box
                        position="absolute"
                        bottom={4}
                        left={4}
                        color="white"
                        cursor="pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewersOpen(true);
                        }}
                        bg="blackAlpha.600"
                        px={3}
                        py={1}
                        borderRadius="full"
                    >
                        <Text fontSize="sm" fontWeight="bold">
                            👁️ {currentStatus.views.length} view{currentStatus.views.length !== 1 ? "s" : ""}
                        </Text>
                    </Box>
                )}
            </ModalContent>

            {/* Viewers List Modal */}
            <Modal isOpen={isViewersOpen} onClose={() => setViewersOpen(false)} size="sm" isCentered>
                <ModalOverlay />
                <ModalContent maxH="400px" overflowY="auto">
                    <ModalHeader>Viewed by</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {currentStatus.views.length === 0 ? (
                            <Text color="gray.500">No views yet</Text>
                        ) : (
                            currentStatus.views.map((view, index) => (
                                <Box key={index} display="flex" alignItems="center" mb={3}>
                                    <Avatar size="sm" src={view.user.pic} name={view.user.name} mr={3} />
                                    <Box>
                                        <Text fontWeight="bold">{view.user.name}</Text>
                                        <Text fontSize="xs" color="gray.500">
                                            {new Date(view.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Modal>
    );
};

export default StatusViewer;
