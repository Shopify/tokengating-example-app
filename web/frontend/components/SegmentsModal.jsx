import { useCallback, useState } from "react";
import {
  Button,
  Card,
  Modal,
  ResourceList,
  ResourceItem,
  Stack,
  TextField,
} from "@shopify/polaris";
import { CancelSmallMinor } from "@shopify/polaris-icons";

export const SegmentsModal = ({ segment }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [textFieldValue, setTextFieldValue] = useState(undefined);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  const handleTextFieldChange = useCallback(
    (newValue) => setTextFieldValue(newValue),
    []
  );

  const handleSelection = () => {
    segment.onChange([...segment.value, textFieldValue]);
    setTextFieldValue(undefined);
    toggleModal();
  };

  const handleRemoveAddress = useCallback(
    (removedAddress) => {
      const filteredAddresses = segment.value.filter(
        (address) => address !== removedAddress
      );
      segment.onChange(filteredAddresses);
    },
    [segment.value]
  );

  const listItemMarkup = (address) => {
    return (
      <ResourceItem verticalAlignment="center">
        <Stack alignment="center">
          <Stack.Item fill>
            <p>{address}</p>
          </Stack.Item>
          <Button
            icon={CancelSmallMinor}
            plain
            accessibilityLabel="cancel"
            onClick={() => handleRemoveAddress(address)}
          />
        </Stack>
      </ResourceItem>
    );
  };

  const selectedSegmentsMarkup = () => {
    if (segment.value.length > 0) {
      return (
        <ResourceList
          resourceName={{
            singular: "segment",
            plural: "segments",
          }}
          renderItem={listItemMarkup}
          items={segment.value}
        />
      );
    }

    return (
      <Card.Section>
        <Stack distribution="center">
          <Button onClick={toggleModal}>Add token collection</Button>
        </Stack>
      </Card.Section>
    );
  };

  return (
    <Card.Section
      title="SEGMENT"
      actions={
        segment.value.length > 0
          ? [
              {
                content: "Add token collection",
                onAction: toggleModal,
              },
            ]
          : []
      }
    >
      {selectedSegmentsMarkup()}
      <Modal
        open={isOpen}
        onClose={toggleModal}
        title="Add token collection"
        primaryAction={{
          content: "Add",
          onAction: handleSelection,
        }}
        secondaryActions={[
          {
            content: "Close",
            onAction: toggleModal,
          },
        ]}
      >
        <Modal.Section>
          <TextField
            name="segment"
            type="string"
            placeholder="Enter smart contract address"
            value={textFieldValue}
            onChange={handleTextFieldChange}
            autoComplete="off"
          />
        </Modal.Section>
      </Modal>
    </Card.Section>
  );
};
