const TelegramBot = require("node-telegram-bot-api");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual Telegram Bot token
const bot = new TelegramBot('7089382647:AAGX5UKPXC9tat3q9_2Cvur2tkZam3i2piY', { polling: true });


// Replace 'YOUR_ALCHEMY_API_KEY' with your Alchemy API key or use your preferred Ethereum node provider
const alchemyApiKey = "ErZ0kSvmRJ6Uv9Mo87p3tK7IoJ8qUE_m";
const web3 = createAlchemyWeb3(
  `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
);

// Create a map to store wallet names and addresses
const walletMap = new Map();

// Handle the /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage =
    "Welcome to your Ethereum Wallet Monitor Bot!\n\n" +
    "You can use the following commands:\n" +
    "/addWallet - Add a wallet to monitor\n" +
    "/listWallets - List all saved wallets\n" +
    "/start - Display this welcome message";

  bot.sendMessage(chatId, welcomeMessage);
});

// Handle the /addWallet command
bot.onText(/\/addWallet/, (msg) => {
  const chatId = msg.chat.id;

  // Prompt the user to send the wallet address
  bot.sendMessage(
    chatId,
    "🔮Send Ethereum wallet address to monitor\nExample: 0x1234567890abcdef0123456789abcdef01234567"
  );

  // Listen for the next message to capture the wallet address
  const addressListener = (nextMsg) => {
    const walletAddress = nextMsg.text.trim();

    // Check if the wallet address is not already being monitored
    if (!walletMap.has(walletAddress)) {
      // Prompt the user to add a name for the wallet
      bot.sendMessage(chatId, `Enter a name for wallet ${walletAddress}`);

      // Listen for the next message to capture the wallet name
      const nameListener = (nameMsg) => {
        const walletName = nameMsg.text.trim();

        // Add the new wallet address and name to the map
        walletMap.set(walletAddress, walletName);
        bot.sendMessage(
          chatId,
          `Added wallet ${walletName} (${walletAddress})`
        );

        // Stop listening for new wallet names
        bot.removeListener("text", nameListener);
      };

      // Listen for the next message to capture the wallet name
      bot.on("text", nameListener);
    } else {
      bot.sendMessage(
        chatId,
        `Wallet address ${walletAddress} is already being monitored`
      );
    }

    // Stop listening for new wallet addresses
    bot.removeListener("text", addressListener);
  };

  // Listen for the next message to capture the wallet address
  bot.on("text", addressListener);
});

// Handle the /listWallets command
bot.onText(/\/listWallets/, (msg) => {
  const chatId = msg.chat.id;
  let replyText = "List of saved wallets:\n";

  walletMap.forEach((name, address) => {
    replyText += `Name: ${name}\nAddress: ${address}\n\n`;
  });

  bot.sendMessage(chatId, replyText);
});

// Function to check for transactions
async function checkTransactions() {
  try {
    for (const [address, name] of walletMap) {
      // Get the latest transaction for the wallet address
      const transaction = await web3.eth.getTransaction(address);

      // Check if there is any new transaction
      if (transaction) {
        // Notify in the Telegram chat
        bot.sendMessage(
          chatId,
          `New transaction detected for wallet ${name} (${address})!`
        );

        // You can also process and display transaction details here
        console.log("Transaction Details:", transaction);
      }
    }
  } catch (error) {
    // console.error("Error:", error);
  }
}

// Set up a recurring interval to check for new transactions every 1 second
setInterval(checkTransactions, 1000);
