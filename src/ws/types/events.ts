export const ChatClientEvent = {
	SEND_MESSAGE: 'chat:send_message',
	MARK_READ: 'chat:mark_read',
	TYPING: 'chat:typing',
	DELETE_MESSAGE: 'chat:delete_message',
	EDIT_MESSAGE: 'chat:edit_message',
} as const

export type ChatClientEvent =
	(typeof ChatClientEvent)[keyof typeof ChatClientEvent]


export const ChatServerEvent = {
	NEW_MESSAGE: 'chat:new_message',
	MESSAGE_READ: 'chat:message_read',
	USER_TYPING: 'chat:user_typing',
	MESSAGE_DELETED: 'chat:message_deleted',
	MESSAGE_EDITED: 'chat:message_edited',
	NEW_CHAT: 'chat:new_chat',
} as const

export type ChatServerEvent =
	(typeof ChatServerEvent)[keyof typeof ChatServerEvent]


export const NotificationClientEvent = {
	MARK_READ: 'notification:mark_read',
} as const

export type NotificationClientEvent =
	(typeof NotificationClientEvent)[keyof typeof NotificationClientEvent]


export const NotificationServerEvent = {
	NEW_NOTIFICATION: 'notification:new_notification',
} as const

export type NotificationServerEvent =
	(typeof NotificationServerEvent)[keyof typeof NotificationServerEvent]

	
export type ServerEvents = ChatServerEvent | NotificationServerEvent
