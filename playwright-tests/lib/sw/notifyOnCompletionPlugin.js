self.__notifyOnCompletionPlugin = {
  handlerDidComplete: async ({event, request}) => {
    const client = await self.clients.get(event.clientId);
    client.postMessage({cachedURL: request.url});
  },
};
