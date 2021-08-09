const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider());
const contract = require('../compile');

let accounts;
let lottery;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  const [firstAccount] = accounts;
  lottery = await new web3.eth
    .Contract(contract.abi)
    .deploy({ data: contract.evm.bytecode.object })
    .send({ from: firstAccount, gas: '1000000' });
})

describe('Lottery Contract', () => {
  it('Contract is deployed', () => {
    assert.ok(lottery.options.address);
  })

  it('Allows account to enter the lottery', async () => {
    const [firstAccount] = accounts;
    await lottery.methods.enter().send(
      {
        from: firstAccount,
        value: web3.utils.toWei('0.02', 'ether')
      }
    );

    const players = await lottery.methods.getPlayersList().call({
      from: firstAccount
    });

    // console.log('d', await lottery.methods.manager().call({ from: firstAccount }))

    assert.strictEqual(1, players.length);
    assert.strictEqual(players[0], firstAccount)
  })

  it('Allows multiple account to enter the lottery', async () => {
    const [firstAccount, secondAccount, thirdAccount] = accounts;
    await lottery.methods.enter().send(
      {
        from: firstAccount,
        value: web3.utils.toWei('0.02', 'ether')
      }
    );
    await lottery.methods.enter().send(
      {
        from: secondAccount,
        value: web3.utils.toWei('0.02', 'ether')
      }
    );
    await lottery.methods.enter().send(
      {
        from: thirdAccount,
        value: web3.utils.toWei('0.02', 'ether')
      }
    );

    const players = await lottery.methods.getPlayersList().call({
      from: firstAccount
    });

    assert.strictEqual(3, players.length);
    assert.strictEqual(players[0], firstAccount)
    assert.strictEqual(players[1], secondAccount)
    assert.strictEqual(players[2], thirdAccount)
  })

  it('Requires minimum amount of ether to enter', async () => {
    const [firstAccount] = accounts;
    try {
      await lottery.methods.enter().send(
        {
          from: firstAccount,
          value: 0
        }
      );
    } catch (error) {
      assert(error)
    }

    const players = await lottery.methods.getPlayersList().call({
      from: firstAccount
    });

    assert.strictEqual(0, players.length);
  })

  it('Only manager can call pickWinner', async () => {
    const [firstAccount] = accounts;
    try {
      await lottery.methods.pickWinner().send(
        {
          from: firstAccount
        }
      );
    } catch (error) {
      assert(error)
    }
  })

  it('Adds players to the lottery, selects a winner and resets lottery', async () => {
    const [firstAccount] = accounts;
    await lottery.methods.enter().send(
      {
        from: firstAccount,
        value: web3.utils.toWei('2', 'ether')
      }
    );

    const initalBalance = await web3.eth.getBalance(firstAccount);

    await lottery.methods.pickWinner().send(
      {
        from: firstAccount
      }
    );

    const finalBalance = await web3.eth.getBalance(firstAccount);;
    const difference = finalBalance - initalBalance;
    assert(difference > web3.utils.toWei('1.8', 'ether'));
  })
});
