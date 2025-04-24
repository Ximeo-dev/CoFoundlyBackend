export enum TokenValidationResult {
	Valid,
	Expired,
	Invalid,
}

export interface TokenValidationSuccess {
	result: TokenValidationResult.Valid
	payload: { id: string }
}

export interface TokenValidationFailure {
	result: TokenValidationResult.Expired | TokenValidationResult.Invalid
}

export type TokenValidationResponse = TokenValidationSuccess | TokenValidationFailure;