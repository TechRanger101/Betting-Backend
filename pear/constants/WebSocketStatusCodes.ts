/**
 * WebSocket (WS) Close Codes
 * @see {@link https://github.com/Luka967/websocket-close-codes}
 */
export enum WebSocketCloseCode {
  /**
   *   Successful operation / regular socket shutdown
   */
  CLOSE_NORMAL = 1000,
  /**
   *   Client is leaving (browser tab closing)
   */
  CLOSE_GOING_AWAY = 1001,
  /**
   *   Endpoint received a malformed frame
   */
  CLOSE_PROTOCOL_ERROR = 1002,
  /**
   *   Endpoint received an unsupported frame (e.g. binary-only endpoint received text frame)
   */
  CLOSE_UNSUPPORTED = 1003,
  /**
   *   Expected close status, received none
   */
  CLOSE_NO_STATUS = 1005,
  /**
   *   No close code frame has been received
   */
  CLOSE_ABNORMAL = 1006,
  /**
   *   Endpoint received inconsistent message (e.g. malformed UTF-8)
   */
  UNSUPPORTED_PAYLOAD = 1007,
  /**
   *   The endpoint is terminating the connection because it received a message that violates its policy.
   *   This is a generic status code, used when codes 1003 and 1009 are not suitable.
   */
  POLICY_VIOLATION = 1008,
  /**
   *   Endpoint won't process large frameThe endpoint is terminating the connection
   *   because a data frame was received that is too large.
   */
  MESSAGE_TOO_BIG = 1009,
  /**
   *   Client wanted an extension which server did not negotiate
   */
  MANDATORY_EXTENSION = 1010,
  /**
   *   Internal server error while operating
   */
  SERVER_ERROR = 1011,
  /**
   *   Server/service is restarting
   */
  SERVICE_RESTART = 1012,
  /**
   *   Temporary server condition forced blocking client's request
   */
  TRY_AGAIN_LATER = 1013,
  /**
   *   Server acting as gateway received an invalid response
   */
  BAD_GATEWAY = 1014,
  /**
   *   Transport Layer Security handshake failure
   */
  TLS_HANDSHAKE_FAILED = 1015,

  /**
   *   When an user sessionId exists and the same user connects with a new client
   *   close the existing session and clear sessionId in RedisStore
   */
  NEW_CONNECTION_SESSION = 4000,
}

/**
 *   Web Socket Custom Message Codes
 *   Defined codes for our specific application
 *   Codes 3000-3999 for use by libaries, frameworks, and applications.
 *   @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code}
 */
export enum WebSocketCustomCodes {
  /**
   * Indicates a user doesn't have access to perform this action
   */
  RESTRICTED_USER_ACTION = 3000,
  /**
   * Message parameter validation error
   */
  MESSAGE_VALIDATION_ERROR = 3001,

  USER_MESSAGE_TIMEOUT = 3002,
}
