// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

using Colyseus.Schema;

namespace FareProtocol.Schemas {
	public partial class GuestUser : Schema {
		[Type(0, "string")]
		public string guestId = default(string);

		[Type(1, "string")]
		public string sessionId = default(string);
	}
}
