export enum ChatClientEvent {
	SEND_MESSAGE = 'chat:send_message',
	MARK_READ = 'chat:mark_read',
	TYPING = 'chat:typing',
	DELETE_MESSAGE = 'chat:delete_message',
	EDIT_MESSAGE = 'chat:edit_message',
}

export enum ChatServerEvent {
	NEW_MESSAGE = 'chat:new_message',
	READ = 'chat:read',
	USER_TYPING = 'chat:typing',
	MESSAGE_DELETED = 'chat:deleted',
	MESSAGE_EDITED = 'chat:edited',
}
