export enum ChatClientEvent {
	SEND_MESSAGE = 'chat:send_message',
	GET_MESSAGES = 'chat:get_messages',
	MARK_READ = 'chat:mark_read',
	TYPING = 'chat:typing',
	DELETE_MESSAGE = 'chat:delete_message',
	EDIT_MESSAGE = 'chat:edit_message',
	JOIN_CHAT = 'chat:join',
	LEAVE_CHAT = 'chat:leave',
}

export enum ChatServerEvent {
	NEW_MESSAGE = 'chat:new_message',
	READ = 'chat:read',
	USER_TYPING = 'chat:typing',
	MESSAGE_DELETED = 'chat:deleted',
	MESSAGE_EDITED = 'chat:edited',
}
