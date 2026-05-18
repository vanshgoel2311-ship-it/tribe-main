import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text, Spacer } from "@chakra-ui/layout";
import Emoji from "../asset/emoji.svg";
import "./styles.css";
import {
  IconButton,
  Spinner,
  useToast,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ArrowBackIcon, AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { Video, Image as ImageIcon, Trash2, Mic, StopCircle, Camera } from "lucide-react";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
import { Image, Avatar } from "@chakra-ui/react";
import Robot from "../asset/robot.gif";
// import { PlusSquareIcon } from "@chakra-ui/icons";
import Picker from "emoji-picker-react";

// Socket.io

const ENDPOINT = process.env.REACT_APP_API_ENDPOINT || "http://localhost:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false); // Connection status of a socket
  const [showEmojiPicker, setshowEmojiPicker] = useState(false); // For Emoji Picker
  const [pic, setPic] = useState();
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Voice note recording state
  const [mediaRecorder, setMediaRecorder] = useState(null); // MediaRecorder instance
  const [audioChunks, setAudioChunks] = useState([]); // Audio data chunks
  const { isOpen, onOpen, onClose } = useDisclosure(); // Delete dialog
  const [deleteType, setDeleteType] = useState(""); // "me" or "everyone"
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [gifSearch, setGifSearch] = useState("");
  const [loadingGifs, setLoadingGifs] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messageToDelete, setMessageToDelete] = useState(null); // For individual message deletion
  const cancelRef = useRef();
  const toast = useToast();

  // Fallback GIFs in case API fails
  const fallbackGifs = [
    {
      id: "1",
      title: "Happy Dance",
      images: {
        fixed_height_small: { url: "https://media.giphy.com/media/l0amJbHuX8zggJuHo5/giphy.gif" },
        original: { url: "https://media.giphy.com/media/l0amJbHuX8zggJuHo5/giphy.gif" }
      }
    },
    {
      id: "2",
      title: "Thumbs Up",
      images: {
        fixed_height_small: { url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
        original: { url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" }
      }
    },
    {
      id: "3",
      title: "Laughing",
      images: {
        fixed_height_small: { url: "https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif" },
        original: { url: "https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif" }
      }
    },
    {
      id: "4",
      title: "Confused",
      images: {
        fixed_height_small: { url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif" },
        original: { url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif" }
      }
    }
  ];

  // Fetch GIFs from Tenor
  const fetchGifs = async (query = "") => {
    setLoadingGifs(true);
    try {
      // Tenor Public API Key (LIVDSRZULELA)
      const apiKey = "LIVDSRZULELA";
      const clientKey = "chathub_app"; // Optional client key for Tenor
      const baseUrl = "https://g.tenor.com/v1";

      const endpoint = query
        ? `${baseUrl}/search?q=${query}&key=${apiKey}&client_key=${clientKey}&limit=20`
        : `${baseUrl}/trending?key=${apiKey}&client_key=${clientKey}&limit=20`;

      const { data } = await axios.get(endpoint);

      // Transform Tenor data to match our expected format
      const formattedGifs = data.results.map(gif => ({
        id: gif.id,
        title: gif.content_description || "GIF",
        images: {
          fixed_height_small: { url: gif.media[0].nanogif.url },
          original: { url: gif.media[0].gif.url }
        }
      }));

      setGifs(formattedGifs);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      toast({
        title: "Using Demo GIFs",
        description: "Tenor API limit reached or error. Showing demo GIFs.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      setGifs(fallbackGifs);
    }
    setLoadingGifs(false);
  };

  const searchGifs = (query) => {
    if (query.length > 2 || query.length === 0) {
      fetchGifs(query);
    }
  };

  useEffect(() => {
    if (showGifPicker) {
      fetchGifs();
    }
  }, [showGifPicker]);

  const sendGif = async (gifUrl) => {
    setShowGifPicker(false);
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token} `,
        },
      };

      const { data } = await axios.post(
        "/api/message",
        {
          content: `[GIF]${gifUrl}`,
          chatId: selectedChat,
        },
        config
      );

      socket.emit("new message", data);
      setMessages([...messages, data]);
    } catch (error) {
      toast({
        title: "Error sending GIF",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMessages([]);
  };

  const toggleMessageSelection = (messageId) => {
    if (selectedMessages.includes(messageId)) {
      setSelectedMessages(selectedMessages.filter((id) => id !== messageId));
    } else {
      setSelectedMessages([...selectedMessages, messageId]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMessages.length === 0) return;
    // Open the delete dialog to ask Delete for Me or Delete for Everyone
    onOpen();
  };

  const confirmBulkDelete = async () => {
    if (selectedMessages.length === 0) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      };

      // We'll delete messages one by one for now as we don't have a bulk delete endpoint
      // Ideally, we should create a bulk delete endpoint for efficiency
      await Promise.all(
        selectedMessages.map((msgId) =>
          axios.delete(`/api/message/${msgId}`, {
            ...config,
            data: { deleteType },
          })
        )
      );

      toast({
        title: deleteType === "everyone" ? "Messages deleted for everyone" : "Messages deleted for you",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });

      setIsSelectionMode(false);
      setSelectedMessages([]);
      onClose();
      fetchMessages(); // Refresh messages
    } catch (error) {
      toast({
        title: "Error deleting messages",
        description: "Could not delete some messages",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleIndividualMessageDelete = (messageId) => {
    setMessageToDelete(messageId);
    onOpen();
  };

  const confirmIndividualDelete = async () => {
    if (!messageToDelete) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      };

      await axios.delete(`/api/message/${messageToDelete}`, {
        ...config,
        data: { deleteType },
      });

      toast({
        title: deleteType === "everyone" ? "Message deleted for everyone" : "Message deleted for you",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });

      setMessageToDelete(null);
      onClose();
      fetchMessages(); // Refresh messages
    } catch (error) {
      toast({
        title: "Error deleting message",
        description: error.response?.data?.message || "Could not delete message",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  // Lottie Animations
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

  const messagesBg = useColorModeValue("#f8f9fd", "gray.700");
  const inputBg = useColorModeValue("#E0E0E0", "gray.600");
  const emojiBg = useColorModeValue("#fff", "black");
  const userNameColor = useColorModeValue("#4e00ff", "blue.300");

  // New color variables for the redesigned input
  const formBg = useColorModeValue("white", "gray.800");
  const emojiFilter = useColorModeValue("none", "invert(1)");
  const gifBorderColor = useColorModeValue("gray.300", "gray.600");
  const attachIconColor = useColorModeValue("gray.500", "gray.400");
  const inputFieldBg = useColorModeValue("gray.100", "gray.700");

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedMedia, setCapturedMedia] = useState(null); // URL or Blob
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [videoChunks, setVideoChunks] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on("online-users", (users) => {
        setOnlineUsers(users);
      });
      return () => {
        socket.off("online-users");
      };
    }
  }, [socket]);

  const isUserOnline = (chat) => {
    if (!chat || chat.isGroupChat) return false;
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return otherUser && onlineUsers.includes(otherUser._id);
  };

  // Start Camera
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      // Try getting both video and audio
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.warn("Could not access audio/video, trying video only:", error);
      try {
        // Fallback: Try getting only video
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (videoError) {
        console.error("Error accessing camera:", videoError);
        toast({
          title: "Camera Error",
          description: "Could not access camera. Please check permissions and ensure your device has a camera.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        setIsCameraOpen(false);
      }
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCapturedMedia(null);
    setMediaType(null);
    setIsRecordingVideo(false);
    setVideoChunks([]);
  };

  // Capture Photo
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const imageUrl = canvas.toDataURL("image/jpeg");
    setCapturedMedia(imageUrl);
    setMediaType("image");
  };

  // Start Recording Video
  const startVideoRecording = () => {
    setVideoChunks([]);
    const recorder = new MediaRecorder(cameraStream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setVideoChunks((prev) => [...prev, e.data]);
      }
    };

    recorder.start();
    setIsRecordingVideo(true);
  };

  // Stop Recording Video
  const stopVideoRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecordingVideo(false);

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(videoChunks, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(blob);
      setCapturedMedia(videoUrl);
      setMediaType("video");
    };
  };

  // Send Captured Media
  const sendCapturedMedia = async () => {
    if (!capturedMedia) return;

    setLoading(true);
    try {
      let fileToSend;
      if (mediaType === "image") {
        // Convert Data URL to Blob
        const res = await fetch(capturedMedia);
        const blob = await res.blob();
        fileToSend = new File([blob], "photo.jpg", { type: "image/jpeg" });
      } else {
        // Video Blob
        const blob = new Blob(videoChunks, { type: "video/webm" });
        fileToSend = new File([blob], "video.webm", { type: "video/webm" });
      }

      // Upload to Cloudinary
      const data = new FormData();
      data.append("file", fileToSend);
      data.append("upload_preset", "chat-hub");
      data.append("cloud_name", "dyjnlh1ef");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dyjnlh1ef/${mediaType === 'image' ? 'image' : 'video'}/upload`,
        {
          method: "post",
          body: data,
        }
      );
      const result = await response.json();

      // Send Message
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token} `,
        },
      };

      const { data: messageData } = await axios.post(
        "/api/message",
        {
          content: result.secure_url,
          chatId: selectedChat,
        },
        config
      );

      socket.emit("new message", messageData);
      setMessages([...messages, messageData]);
      stopCamera();
    } catch (error) {
      console.error("Error sending media:", error);
      toast({
        title: "Error sending media",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  // Retake
  const retake = () => {
    setCapturedMedia(null);
    setMediaType(null);
    setVideoChunks([]);
  };

  // Play notification sound using base64 encoded audio
  const playNotificationSound = () => {
    // ... (rest of the function)
  };

  // ... (rest of the component logic)

  // ... (inside JSX)


  // Fetching all the chats
  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token} `,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      // Mark messages as read
      try {
        await axios.put(
          "/api/message/read",
          { chatId: selectedChat._id },
          config
        );
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }

      // User can Join the room
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  // Send The Message On Enter Key
  const sendMessage = async (event) => {
    // Stop Typing after enter key
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        // JWT Auth
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token} `,
          },
        };

        setNewMessage("");
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat,
          },
          config
        );

        // send message from socket
        socket.emit("new message", data);
        setMessages([...messages, data]); // append latest message at last of message array
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  // Start Socket.io
  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // eslint-disable-next-line
  }, []);

  // Call Fetch Chat Method to fetch all chats whenever selectedChat changes
  useEffect(() => {
    fetchMessages();

    // To keep backup of selectedChat to compare it and decide to emit the message or send notification
    selectedChatCompare = selectedChat;

    // eslint-disable-next-line
  }, [selectedChat]);

  // UseEffect with no dependency because we want to update this effect every time our state changes

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        // Give Notification
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
          // Play notification sound
          playNotificationSound();
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  // Show receiver that sender is typing (Typing Indicator)
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    // Stop Typing after 3 sec user is not typing
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // Emoji Picker
  const handelEmojiPickerShow = () => {
    setshowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (event, emoji) => {
    const message = newMessage + event.emoji;
    setNewMessage(message);
  };

  // handel image upload
  // const handelImage = async (e) => {
  //   const file = e.target.files[0];
  //   let formData = new formData();
  //   formData.append("image", file);
  //   console.log([...formData]);
  // };

  // to uplod pic to cloud
  const postDetails = (pics) => {
    setLoading(true);
    if (pics === undefined) {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    console.log(pics);
    if (pics.type === "image/jpeg" || pics.type === "image/png") {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "chat-hub");
      data.append("cloud_name", "dyjnlh1ef");
      fetch("https://api.cloudinary.com/v1_1/dyjnlh1ef/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          setPic(data.url.toString());
          console.log(data.url.toString());
          /////////////////
          const message = newMessage + data.url.toString();
          setNewMessage(message);
          ////////////////////
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        });
    } else {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }
  };

  const updateWallpaper = async (pics) => {
    setLoading(true);
    if (pics === undefined) {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    if (pics.type === "image/jpeg" || pics.type === "image/png") {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "chat-hub");
      data.append("cloud_name", "dyjnlh1ef");
      fetch("https://api.cloudinary.com/v1_1/dyjnlh1ef/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then(async (data) => {
          try {
            const config = {
              headers: {
                Authorization: `Bearer ${user.token} `,
              },
            };
            const { data: updatedChat } = await axios.put(
              "/api/chat/wallpaper",
              {
                chatId: selectedChat._id,
                wallpaper: data.url.toString(),
              },
              config
            );
            setSelectedChat(updatedChat);
            setLoading(false);
            toast({
              title: "Wallpaper Updated!",
              status: "success",
              duration: 5000,
              isClosable: true,
              position: "bottom",
            });
          } catch (error) {
            toast({
              title: "Error Occured!",
              description: error.response.data.message,
              status: "error",
              duration: 5000,
              isClosable: true,
              position: "bottom",
            });
            setLoading(false);
          }
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        });
    } else {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }
  };
  const removeWallpaper = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token} `,
        },
      };
      const { data: updatedChat } = await axios.put(
        "/api/chat/wallpaper",
        {
          chatId: selectedChat._id,
          wallpaper: "",
        },
        config
      );
      setSelectedChat(updatedChat);
      setLoading(false);
      toast({
        title: "Wallpaper Removed!",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  // Voice Note Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop()); // Stop microphone
        await uploadAndSendAudio(audioBlob);
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record voice notes.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const uploadAndSendAudio = async (audioBlob) => {
    try {
      setLoading(true);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", audioBlob);
      formData.append("upload_preset", "chat-hub");
      formData.append("cloud_name", "dyjnlh1ef");
      formData.append("resource_type", "video"); // Cloudinary uses 'video' for audio files

      const uploadResponse = await fetch(
        "https://api.cloudinary.com/v1_1/dyjnlh1ef/video/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.secure_url;

      // Send message with audio URL
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token} `,
        },
      };

      const { data } = await axios.post(
        "/api/message",
        {
          content: `[VOICE_NOTE]${audioUrl} `,
          chatId: selectedChat,
        },
        config
      );

      socket.emit("new message", data);
      setMessages([...messages, data]);
      setLoading(false);

      toast({
        title: "Voice Note Sent!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      setLoading(false);
      toast({
        title: "Failed to send voice note",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      console.error("Error uploading audio:", error);
    }
  };

  // Delete Chat Handler
  const handleDeleteChat = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token} `,
          "Content-Type": "application/json",
        },
      };

      await axios.delete(`/api/chat/${selectedChat._id}`, {
        ...config,
        data: { deleteType },
      });

      toast({
        title: deleteType === "everyone" ? "Chat deleted for everyone" : "Chat deleted for you",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });

      setSelectedChat(null); // Deselect chat
      setFetchAgain(!fetchAgain); // Refresh chat list
      onClose();
    } catch (error) {
      toast({
        title: "Error deleting chat",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const openDeleteDialog = (type) => {
    setDeleteType(type);
    onOpen();
  };



  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />

            {isSelectionMode ? (
              <Box display="flex" alignItems="center" gap={2} flex={1} ml={2}>
                <Button size="sm" onClick={toggleSelectionMode}>
                  Cancel
                </Button>
                <Text fontSize="lg" ml={2}>{selectedMessages.length} Selected</Text>
                <Spacer />
                {selectedMessages.length > 0 && (
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={handleBulkDelete}
                    leftIcon={<DeleteIcon />}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            ) : (
              <>
                {!selectedChat.isGroupChat ? (
                  <>
                    <ProfileModal user={getSenderFull(user, selectedChat.users)}>
                      <Box display="flex" alignItems="center" cursor="pointer">
                        <Avatar
                          size="sm"
                          cursor="pointer"
                          name={getSender(user, selectedChat.users)}
                          src={getSenderFull(user, selectedChat.users).pic}
                        />
                        <Box>
                          <Text fontSize="xl" ml={3} fontWeight="bold">
                            {getSender(user, selectedChat.users)}
                          </Text>
                          {isUserOnline(selectedChat) && (
                            <Text fontSize="xs" ml={3} color="green.500" fontWeight="bold">
                              Online
                            </Text>
                          )}
                        </Box>
                      </Box>
                    </ProfileModal>
                  </>
                ) : (
                  <>
                    <UpdateGroupChatModal
                      fetchMessages={fetchMessages}
                      fetchAgain={fetchAgain}
                      setFetchAgain={setFetchAgain}
                    >
                      <Box display="flex" alignItems="center" cursor="pointer">
                        <Avatar
                          size="sm"
                          cursor="pointer"
                          name={selectedChat.chatName}
                        />
                        <Text fontSize="xl" ml={3} fontWeight="bold">
                          {selectedChat.chatName.toUpperCase()}
                        </Text>
                      </Box>
                    </UpdateGroupChatModal>
                  </>
                )}

                <Box display="flex" alignItems="center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleSelectionMode}
                    mr={2}
                  >
                    Select
                  </Button>

                  {selectedChat.wallpaper && (
                    <IconButton
                      display={{ base: "flex" }}
                      icon={<Trash2 />}
                      onClick={removeWallpaper}
                      mr={2}
                      colorScheme="red"
                      variant="ghost"
                    />
                  )}
                  <label htmlFor="wallpaper-upload">
                    <IconButton
                      display={{ base: "flex" }}
                      icon={<ImageIcon />}
                      as="span"
                      mr={2}
                      cursor="pointer"
                    />
                  </label>
                  <input
                    type="file"
                    id="wallpaper-upload"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => updateWallpaper(e.target.files[0])}
                  />
                  <IconButton
                    display={{ base: "flex" }}
                    icon={<Video />}
                    onClick={() => window.open("https://meet.google.com/new", "_blank")}
                    mr={2}
                  />
                </Box>
              </>
            )}
          </Text>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg={messagesBg}
            backgroundImage={selectedChat.wallpaper ? `url(${selectedChat.wallpaper})` : "none"}
            backgroundSize="cover"
            backgroundPosition="center"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {/* If Messages are loading show spinner else render all messages */}
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat
                  messages={messages}
                  isSelectionMode={isSelectionMode}
                  selectedMessages={selectedMessages}
                  toggleMessageSelection={toggleMessageSelection}
                  onDeleteMessage={handleIndividualMessageDelete}
                />
              </div>
            )}

            {/* Input to enter new message */}
            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
              display="flex"
              alignItems="center"
              gap={2}
              bg={formBg}
              p={2}
              borderRadius="lg"
            >
              {/* Typing Animation */}
              {istyping && (
                <div style={{ position: "absolute", bottom: "50px", left: "20px" }}>
                  <Lottie
                    options={defaultOptions}
                    width={50}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              )}

              {/* Emoji Picker */}
              <Box position="relative">
                <Image
                  height="24px"
                  width="24px"
                  src={Emoji}
                  alt="Emoji"
                  cursor="pointer"
                  onClick={handelEmojiPickerShow}
                  filter={emojiFilter}
                />
                {showEmojiPicker && (
                  <Box
                    position="absolute"
                    bottom="50px"
                    left="0"
                    zIndex="999"
                    bg={emojiBg}
                    boxShadow="xl"
                    borderRadius="lg"
                    p={2}
                  >
                    <Picker onEmojiClick={handleEmojiClick} />
                  </Box>
                )}
              </Box>

              {/* GIF Picker */}
              <Box position="relative">
                <Button
                  size="xs"
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  variant="ghost"
                  p={1}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={gifBorderColor}
                >
                  <Text fontSize="xs" fontWeight="bold">GIF</Text>
                </Button>
                {showGifPicker && (
                  <Box
                    position="absolute"
                    bottom="50px"
                    left="0"
                    zIndex="999"
                    bg={emojiBg}
                    boxShadow="xl"
                    borderRadius="lg"
                    p={2}
                    w="300px"
                    h="400px"
                    overflowY="auto"
                  >
                    <Input
                      placeholder="Search GIFs..."
                      mb={2}
                      size="sm"
                      value={gifSearch}
                      onChange={(e) => {
                        setGifSearch(e.target.value);
                        searchGifs(e.target.value);
                      }}
                    />
                    {loadingGifs ? (
                      <Spinner size="sm" />
                    ) : (
                      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
                        {gifs.map((gif) => (
                          <Image
                            key={gif.id}
                            src={gif.images.fixed_height_small.url}
                            alt={gif.title}
                            cursor="pointer"
                            onClick={() => sendGif(gif.images.original.url)}
                            borderRadius="md"
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {/* Attachment Icon */}
              <label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                <AddIcon color={attachIconColor} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => postDetails(e.target.files[0])}
                  hidden
                />
              </label>

              {/* Camera Icon */}
              <IconButton
                icon={<Camera />}
                onClick={startCamera}
                variant="ghost"
                size="sm"
                color={attachIconColor}
                aria-label="Open Camera"
              />

              {/* Input Field */}
              <Input
                variant="unstyled"
                bg={inputFieldBg}
                placeholder="Type a message"
                value={newMessage}
                onChange={typingHandler}
                borderRadius="full"
                px={4}
                py={2}
                height="40px"
                flex={1}
              />
              {/* ... */}


              {/* Camera Modal */}
              <Modal isOpen={isCameraOpen} onClose={stopCamera} size="xl" isCentered>
                <ModalOverlay />
                <ModalContent bg="black" color="white">
                  <ModalHeader>Camera</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    {!capturedMedia ? (
                      <Box position="relative" width="100%" height="400px" bg="black" borderRadius="md" overflow="hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Box position="absolute" bottom="20px" width="100%" display="flex" justifyContent="center" gap={4}>
                          <IconButton
                            icon={<Camera />}
                            onClick={capturePhoto}
                            colorScheme="blue"
                            isRound
                            size="lg"
                            aria-label="Capture Photo"
                          />
                          <IconButton
                            icon={isRecordingVideo ? <StopCircle /> : <Video />}
                            onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                            colorScheme={isRecordingVideo ? "red" : "gray"}
                            isRound
                            size="lg"
                            aria-label="Record Video"
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box width="100%" display="flex" flexDirection="column" alignItems="center">
                        {mediaType === "image" ? (
                          <Image src={capturedMedia} alt="Captured" maxHeight="400px" objectFit="contain" />
                        ) : (
                          <video src={capturedMedia} controls style={{ maxHeight: "400px", maxWidth: "100%" }} />
                        )}
                        <Box mt={4} display="flex" gap={4}>
                          <Button onClick={retake} variant="outline" colorScheme="whiteAlpha">
                            Retake
                          </Button>
                          <Button onClick={sendCapturedMedia} colorScheme="green" isLoading={loading}>
                            Send
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </ModalBody>
                </ModalContent>
              </Modal>


              {/* Voice Note / Send Button */}
              {newMessage ? (
                <IconButton
                  icon={<ArrowBackIcon transform="rotate(180deg)" />} // Using ArrowBack as Send icon substitute or import Send icon
                  onClick={(e) => sendMessage({ key: "Enter" })} // Hack to reuse sendMessage
                  colorScheme="green"
                  borderRadius="full"
                  size="sm"
                  aria-label="Send message"
                />
              ) : (
                <IconButton
                  icon={isRecording ? <StopCircle /> : <Mic />}
                  onClick={isRecording ? stopRecording : startRecording}
                  colorScheme={isRecording ? "red" : "gray"}
                  variant="ghost"
                  borderRadius="full"
                  size="sm"
                  aria-label={isRecording ? "Stop recording" : "Record voice note"}
                  isLoading={loading && isRecording}
                />
              )}
            </FormControl >
          </Box >
        </>
      ) : (
        // to get socket.io on same page
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3}>
            <Image height="20rem" src={Robot} alt="Logo" />
            <Text
              display="flex"
              justifyContent="center"
              alignItems="center"
              color={userNameColor}
            >
              {user.name}!
            </Text>
            <Text>Click on a user to start chatting</Text>
          </Text>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {isSelectionMode
                ? "Delete Selected Messages"
                : messageToDelete
                  ? "Delete Message"
                  : "Delete Chat"}
            </AlertDialogHeader>

            <AlertDialogBody>
              {isSelectionMode
                ? `You have selected ${selectedMessages.length} message(s). How do you want to delete them?`
                : messageToDelete
                  ? "How do you want to delete this message?"
                  : (deleteType === "everyone"
                    ? "Are you sure? This will permanently delete the chat and all messages for everyone."
                    : "Are you sure? This will remove the chat from your list.")}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              {isSelectionMode ? (
                <>
                  <Button
                    colorScheme="orange"
                    onClick={() => {
                      setDeleteType("me");
                      confirmBulkDelete();
                    }}
                    ml={3}
                  >
                    Delete for Me
                  </Button>
                  {(!selectedChat.isGroupChat || selectedChat.groupAdmin._id === user._id) && (
                    <Button
                      colorScheme="red"
                      onClick={() => {
                        setDeleteType("everyone");
                        confirmBulkDelete();
                      }}
                      ml={3}
                    >
                      Delete for Everyone
                    </Button>
                  )}
                </>
              ) : messageToDelete ? (
                <>
                  <Button
                    colorScheme="orange"
                    onClick={() => {
                      setDeleteType("me");
                      confirmIndividualDelete();
                    }}
                    ml={3}
                  >
                    Delete for Me
                  </Button>
                  {(!selectedChat.isGroupChat || selectedChat.groupAdmin._id === user._id) && (
                    <Button
                      colorScheme="red"
                      onClick={() => {
                        setDeleteType("everyone");
                        confirmIndividualDelete();
                      }}
                      ml={3}
                    >
                      Delete for Everyone
                    </Button>
                  )}
                </>
              ) : (
                <Button colorScheme="red" onClick={handleDeleteChat} ml={3}>
                  Delete
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default SingleChat;
