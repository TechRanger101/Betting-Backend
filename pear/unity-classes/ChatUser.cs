// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

using Colyseus.Schema;

namespace FareProtocol.Schemas {
	public partial class ChatUser : Schema {
		[Type(0, "string")]
		public string publicAddress = default(string);

		[Type(1, "string")]
		public string username = default(string);

		[Type(2, "string")]
		public string colorTheme = default(string);
	}
}
