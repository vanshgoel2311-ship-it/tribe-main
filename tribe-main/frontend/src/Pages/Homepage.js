import {
  Box,
  Container,
  Hide,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useColorMode,
  Switch,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";
import { Image } from "@chakra-ui/react";
import TribeLogo from "../asset/tribe_logo.png";
import Fox from "../asset/fox2.gif";

function Homepage() {
  //The useHistory hook gives you access to the history instance that you may use to navigate.
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    // localStorage.getItem("userInfo") stores user info in local storage in stringify format
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) {
      // Navigate to the "/chats" route
      navigate("/chats");
    }
  }, [navigate]);


  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", width: "100%" }}>
      <div className="ring">
        <i style={{ "--clr": "#00ff0a" }}></i>
        <i style={{ "--clr": "#ff0057" }}></i>
        <i style={{ "--clr": "#fffd44" }}></i>
        <div className="login">
          <Text display="flex" fontSize="4xl" fontFamily="Work sans" mb={4}>
            <Image
              height="8rem" /* Reduced size to fit */
              src={TribeLogo}
              alt="Logo"
              justifyContent={"center"}
            />
          </Text>

          <Box w="100%" p={4}>
            <Tabs isFitted variant="soft-rounded">
              <TabList mb="1em">
                <Tab _selected={{ color: "white", bg: "blue.500" }} color="white">Login</Tab>
                <Tab _selected={{ color: "white", bg: "blue.500" }} color="white">Sign Up</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Login />
                </TabPanel>
                <TabPanel>
                  <Signup />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </div>
      </div>

      <FormControl display="flex" alignItems="center" position="absolute" top="2" right="2" width="auto">
        <FormLabel htmlFor="theme-switch" mb="0">
          {colorMode === "light" ? "Light" : "Dark"} Mode
        </FormLabel>
        <Switch id="theme-switch" isChecked={colorMode === "dark"} onChange={toggleColorMode} />
      </FormControl>

      <Image
        left={6}
        borderRadius={"full"}
        background={"white"}
        width={80}
        top={40}
        display={{ base: "none", xl: "block" }}
        position={"fixed"}
        overflow={"hidden"}
        zIndex={1}
        src={Fox}
      />
    </div>
  );
}

export default Homepage;
