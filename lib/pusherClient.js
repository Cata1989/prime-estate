import Pusher from 'pusher-js';

let pusherClient;

export function getPusherClient() {
    if (!pusherClient) {
        pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth',
            auth: {
                withCredentials: true,
            },
        });
    }
    return pusherClient;
}