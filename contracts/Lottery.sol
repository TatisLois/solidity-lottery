pragma solidity >=0.7.0 <0.9.0;

contract Lottery {
    address public manager;
    address[] public players;

    constructor() {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > .01 ether);

        address userAdress = msg.sender;
        players.push(userAdress);
    }

    function getPlayersList() public view returns (address[] memory) {
        return players;
    }

    function pickWinner() public restrictToManager {
        uint256 index = fakeRandom() % players.length;
        address winner = players[index];
        payable(winner).transfer(address(this).balance);
        delete players;
    }

    function fakeRandom() private view returns (uint256) {
        uint256 blockDifficulty = block.difficulty;
        uint256 timeStamp = block.timestamp;
        bytes memory fakeRandomEncoding = abi.encodePacked(
            blockDifficulty,
            timeStamp,
            players
        );

        return uint256(keccak256(fakeRandomEncoding));
    }

    modifier restrictToManager() {
        address userAdress = msg.sender;
        require(userAdress == manager);
        _;
    }
}
