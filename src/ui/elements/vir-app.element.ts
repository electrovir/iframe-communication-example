import {randomString} from '@augment-vir/browser';
import {extractErrorMessage} from '@augment-vir/common';
import {css, defineElementNoInputs, html, onDomCreated, renderIf} from 'element-vir';
import {createIframeMessenger, MessageDirection} from '../../iframe-messaging/create-messenger';

const messenger = createIframeMessenger<{
    'request-local-storage-data': {
        [MessageDirection.FromChild]: string;
        [MessageDirection.FromParent]: undefined;
    };
    ready: {
        [MessageDirection.FromChild]: undefined;
        [MessageDirection.FromParent]: undefined;
    };
}>([
    'https://localhost:5173',
    'http://localhost:5173',
]);

const isInsideIframe = globalThis.location.search.includes('iframe=true');

const randomItemKey = 'random-item-key';

if (isInsideIframe) {
    globalThis.localStorage.setItem(randomItemKey, randomString());
}

export const VirApp = defineElementNoInputs({
    tagName: 'vir-app',
    styles: css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
            padding: 64px;
            box-sizing: border-box;
        }

        iframe {
            border: 1px solid red;
        }
    `,
    stateInit: {
        childData: '',
    },
    initCallback() {
        if (isInsideIframe) {
            messenger.listenToParentEvents((message) => {
                if (message.type === 'request-local-storage-data') {
                    return globalThis.localStorage.getItem(randomItemKey) ?? '';
                } else {
                    return undefined;
                }
            });
        }
    },
    renderCallback({state, updateState}) {
        const iframeUrl = [
            globalThis.location.href,
            'iframe=true',
        ].join('?');

        return html`
            From child: ${state.childData}
            <br />
            ${renderIf(
                !isInsideIframe,
                html`
                    <iframe
                        src=${iframeUrl}
                        ${onDomCreated(async (element) => {
                            try {
                                const childData = await messenger.sendMessageToChild({
                                    iframeElement: element as HTMLIFrameElement,
                                    message: {
                                        type: 'request-local-storage-data',
                                    },
                                    verifyData: (input) => typeof input === 'string',
                                });
                                updateState({childData});
                            } catch (error) {
                                updateState({childData: extractErrorMessage(error)});
                            }
                        })}
                    ></iframe>
                `,
                globalThis.localStorage.getItem(randomItemKey),
            )}
        `;
    },
});
