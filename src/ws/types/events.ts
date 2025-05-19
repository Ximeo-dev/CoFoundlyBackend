export enum ChatClientEvent {
	SEND_MESSAGE = 'chat:send_message',
	MARK_READ = 'chat:mark_read',
	TYPING = 'chat:typing',
	DELETE_MESSAGE = 'chat:delete_message',
	EDIT_MESSAGE = 'chat:edit_message',
}

export enum ChatServerEvent {
	NEW_MESSAGE = 'chat:new_message',
	MESSAGE_READ = 'chat:message_read',
	USER_TYPING = 'chat:user_typing',
	MESSAGE_DELETED = 'chat:message_deleted',
	MESSAGE_EDITED = 'chat:message_edited',
	NEW_CHAT = 'chat:new_chat',
}

export enum NotificationClientEvent {
	MARK_READ = 'notification:mark_read'
}

export enum NotificationServerEvent {
	NEW_NOTIFICATION = 'notification:new_notification',
	NOTIFICATION_READ = 'notification:notification_read',
}
