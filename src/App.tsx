import * as React from "react";
import {
  Button,
  Center,
  ChakraProvider,
  Input,
  InputGroup,
  InputLeftAddon,
  Stack,
} from "@chakra-ui/react";
import { useSmartLightInterface } from "./hooks/useSmartLightInterface";
import theme from "./theme";

export const App = () => {
  const {
    connect,
    toggle,
    isConnected,
    setRedLight,
    setGreenLight,
    setBlueLight,
    setColor,
  } = useSmartLightInterface();

  const [customColor, setCustomColor] = React.useState("ffffff");
  const [previewColor, setPreviewColor] = React.useState("ffff");

  const applyCustomColor = async () => {
    setCustomColor(await setColor(customColor));
  };

  return (
    <ChakraProvider theme={theme}>
      <Center height={"100vh"}>
        <Stack>
          {isConnected ? (
            <Stack>
              <Button onClick={toggle} colorScheme={"yellow"} size="lg">
                Toggle light
              </Button>
              <Button onClick={setRedLight} colorScheme={"red"} size="lg">
                Set red light
              </Button>
              <Button onClick={setGreenLight} colorScheme={"green"} size="lg">
                Set green light
              </Button>
              <Button onClick={setBlueLight} colorScheme={"blue"} size="lg">
                Set blue light
              </Button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyCustomColor();
                }}
              >
                <Stack>
                  <InputGroup>
                    <InputLeftAddon children="#" />
                    <Input
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setPreviewColor(
                          "#" + (e.target.value + "000000").slice(0, 6)
                        );
                      }}
                      placeholder="Custom color (e.g. #ff00ff)"
                    />
                  </InputGroup>
                  <Button
                    backgroundColor={previewColor}
                    dropShadow={"0px 0px 4px #cccccc"}
                    size="lg"
                    type="submit"
                  >
                    Set custom color light
                  </Button>
                </Stack>
              </form>
            </Stack>
          ) : (
            <Button onClick={connect} colorScheme="pink" size="lg">
              Connect
            </Button>
          )}
        </Stack>
      </Center>
    </ChakraProvider>
  );
};
