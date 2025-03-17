export const prettifyOutput = (output: Record<string, any>) => {
  const keys = Object.keys(output);
  const firstItem = output[keys[0]];

  if ("messages" in firstItem && Array.isArray(firstItem.messages)) {
    const lastMessage = firstItem.messages[firstItem.messages.length - 1];
    console.dir(
      {
        type: lastMessage._getType(),
        content: lastMessage.content,
        tool_calls: lastMessage.tool_calls,
      },
      { depth: null }
    );
  }

  if ("sender" in firstItem) {
    console.log({
      sender: firstItem.sender,
    });
  }
};
