import {createIframeMessenger, MessageDirection} from './create-messenger';

type Dimensions = {
    width: number;
    height: number;
};

/**
 * These ping and pong messages are used to prevent race conditions between loading the iframe,
 * listening to its messages, and posting messages, both inside of the iframe and outside of it.
 */
enum ExampleMessageType {
    Ready = 'ready',
    SendSize = 'send-size',
    SendScale = 'set-scale',
    SendScalingMethod = 'set-scaling-method',
    ForceSize = 'force-size',
}

type ExampleMessageData = {
    [ExampleMessageType.Ready]: {
        [MessageDirection.FromParent]: undefined;
        [MessageDirection.FromChild]: undefined;
    };
    [ExampleMessageType.SendSize]: {
        [MessageDirection.FromParent]: undefined;
        [MessageDirection.FromChild]: Dimensions;
    };
    [ExampleMessageType.SendScale]: {
        [MessageDirection.FromParent]: Dimensions;
        [MessageDirection.FromChild]: undefined;
    };
    [ExampleMessageType.SendScalingMethod]: {
        [MessageDirection.FromParent]: 'pixelated' | 'default';
        [MessageDirection.FromChild]: undefined;
    };
    [ExampleMessageType.ForceSize]: {
        [MessageDirection.FromParent]: Dimensions | undefined;
        [MessageDirection.FromChild]: undefined;
    };
};

describe(createIframeMessenger.name, () => {
    it('has proper type constraints', () => {
        const messenger = createIframeMessenger<ExampleMessageData>(['']);
        try {
            // @ts-expect-error
            messenger.sendMessageToChild();
            // should allow ExampleMessageType.Ready without any data or data verifier
            messenger.sendMessageToChild({
                iframeElement: undefined as any,
                message: {
                    type: ExampleMessageType.Ready,
                },
            });
            // ExampleMessageType.SendSize requires a data verifier
            // @ts-expect-error
            messenger.sendMessageToChild({
                iframeElement: undefined as any,
                message: {
                    type: ExampleMessageType.SendSize,
                },
            });
            // ExampleMessageType.SendSize requires a data verifier
            messenger.sendMessageToChild({
                iframeElement: undefined as any,
                message: {
                    type: ExampleMessageType.SendSize,
                },
                verifyData: () => {
                    return true;
                },
            });
            messenger.sendMessageToChild({
                iframeElement: undefined as any,
                // ExampleMessageType.SendScalingMethod requires input data
                // @ts-expect-error
                message: {
                    type: ExampleMessageType.SendScalingMethod,
                },
                // ExampleMessageType.SendScalingMethod has no child data, a data verifier is not allowed
                // @ts-expect-error
                verifyData: () => {
                    return true;
                },
            });
            // ExampleMessageType.SendScalingMethod requires data
            messenger.sendMessageToChild({
                iframeElement: undefined as any,
                message: {
                    type: ExampleMessageType.SendScalingMethod,
                    data: 'default',
                },
            });
            messenger.sendMessageToChild({
                iframeElement: undefined as any,
                message: {
                    // cannot send error type
                    // @ts-expect-error
                    type: 'error',
                },
            });
            // ExampleMessageType.SendScalingMethod requires a specific kind of data
            messenger.sendMessageToChild({
                iframeElement: undefined as any,
                message: {
                    type: ExampleMessageType.SendScalingMethod,
                    // @ts-expect-error
                    data: 'not acceptable',
                },
            });
        } catch (error) {}
    });
});
