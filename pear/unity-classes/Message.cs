// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

using Colyseus.Schema;

namespace FareProtocol.Schemas {
	public partial class Message : Schema {
		[Type(0, "string")]
		public string id = default(string);

		[Type(1, "string")]
		public string text = default(string);

		[Type(2, "string")]
		public string createdBy = default(string);

		[Type(3, "string")]
		public string username = default(string);

		[Type(4, "string")]
		public string colorTheme = default(string);

		[Type(5, "string")]
		public string timestamp = default(string);

		[Type(6, "string")]
		public string actorNumber = default(string);
	}
}
