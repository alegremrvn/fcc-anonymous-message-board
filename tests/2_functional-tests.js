const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const THREADSENDPOINT = '/api/threads/general'
const REPLIESENDPOINT = '/api/replies/general'

let thread1Id
let thread2Id
let reply1Id
let reply2Id

describe('Functional Tests', function () {
  describe('Threads', function () {
    before(function (done) {
      const text = 'thread1'
      const delete_password = 'delete thread1'

      chai.request(server)
        .post(THREADSENDPOINT)
        .send({
          text,
          delete_password
        })
        .end(function (err, res) {
        })

        chai.request(server)
        .post(THREADSENDPOINT)
        .send({
          text: 'thread2',
          delete_password: 'delete thread2'
        })
        .end(function (err, res) {
          done()
        })
    })

    it('#1) creating a new thread', function (done) {
      chai.request(server)
        .get(THREADSENDPOINT)
        .end(function (err, res) {
          const text = 'thread2'
          const date = new Date()

          assert.equal(res.status, 200)
          assert.equal(res.body[0].text, text);
          assert.isNotNull(res.body[0]._id);
          assert.equal(new Date(res.body[0].created_on).toDateString(), date.toDateString());
          assert.equal(res.body[0].bumped_on, res.body[0].created_on);
          assert.isArray(res.body[0].replies);
          assert.equal(res.body[0].replycount, 0)

          thread1Id = res.body[1]._id
          thread2Id = res.body[0]._id

          done()
        })
    })

    it('#2) viewing the 10 most recent threads with 3 replies each', function (done) {
      chai.request(server)
        .get(THREADSENDPOINT)
        .end(function (err, res) {
          assert.isAtMost(res.body.length, 10)
          for (let i = 0; i < res.body.length; i++) {
            assert.containsAllKeys(res.body[i], ["_id", "text", "created_on", "bumped_on", "replies"]);
            assert.isAtMost(res.body[i].replies.length, 3);
            assert.notExists(res.body[i].delete_password);
            assert.notExists(res.body[i].reported);
            assert.isAtMost(res.body[i].replies.length, 3);
            for (let j = 0; j < res.body[i].replies.length; j++) {
              assert.notExists(res.body[i].replies[j].delete_password);
              assert.notExists(res.body[i].replies[j].reported);
            }
          }

          done()
        })
    })

    it('#3) deleting a thread with the incorrect password', function (done) {
      chai.request(server)
        .delete(THREADSENDPOINT)
        .send({
          thread_id: thread1Id,
          delete_password: 'incorrect password'
        })
        .end(function (err, res) {
          assert.equal(res.body.not_deleted, 'incorrect password')

          done()
        })
    })

    it('#4) deleting a thread with the correct password', function (done) {
      chai.request(server)
        .delete(THREADSENDPOINT)
        .send({
          thread_id: thread2Id,
          delete_password: 'delete thread2'
        })
        .end(function (err, res) {
          assert.equal(res.body.deleted, 'success')

          done()
        })
    })
    
    it('#5) reporting a thread', function (done) {
      chai.request(server)
        .put(THREADSENDPOINT)
        .send({
          thread_id: thread1Id
        })
        .end(function (err, res) {
          assert.equal(res.status, 200)
          assert.equal(res.text, 'reported')

          done()
        })
    })
  })

  describe('Replies', function () {
    before(function (done) {
      const text = 'reply1'
      const delete_password = 'delete reply1'

      chai.request(server)
        .post(REPLIESENDPOINT)
        .send({
          text,
          delete_password,
          thread_id: thread1Id
        })
        .end(function (err, res) {
        })

      chai.request(server)
        .post(REPLIESENDPOINT)
        .send({
          text: 'reply2',
          delete_password: 'delete reply2',
          thread_id: thread1Id
        })
        .end(function (err, res) {
          done()
        })
    })

    it('#6) creating a new reply', function (done) {
      chai.request(server)
        .get(REPLIESENDPOINT + '?thread_id=' + thread1Id)
        .end(function (err, res) {
          const text = 'reply1'
          const date = new Date()

          assert.equal(res.status, 200)
          assert.equal(res.body.replies[0].text, text);
          assert.equal(new Date(res.body.replies[0].created_on).toDateString(), date.toDateString())
          assert.equal(res.body._id, thread1Id);
          assert.equal(res.body.bumped_on, res.body.replies[1].created_on);

          reply1Id = res.body.replies[0]._id
          reply2Id = res.body.replies[1]._id

          done()
        })
    })

    it('#7) viewing a single thread with all replies', function (done) {
      chai.request(server)
        .get(REPLIESENDPOINT + '?thread_id=' + thread1Id)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.containsAllKeys(res.body, ["_id", "text", "created_on", "bumped_on", "replies"]);
          assert.isArray(res.body.replies);
          assert.notExists(res.body.delete_password);
          assert.notExists(res.body.reported);
          for (let i = 0; i < res.body.replies.length; i++) {
            assert.notExists(res.body.replies[i].delete_password);
            assert.notExists(res.body.replies[i].reported);
          }

          done()
        })
    })

    it('#8) deleting a reply with the incorrect password', function(done) {
      chai.request(server)
        .delete(REPLIESENDPOINT + '?thread_id=' + thread1Id)
        .send({
          thread_id: thread1Id,
          reply_id: reply1Id,
          delete_password: 'incorrect password'
        })
        .end(function (err, res) {
          assert.equal(res.body.not_deleted, 'incorrect password')
          
          done()
        })
    })

    it('#9) deleting a reply with the correct password', function(done) {
      chai.request(server)
        .delete(REPLIESENDPOINT + '?thread_id=' + thread1Id)
        .send({
          thread_id: thread1Id,
          reply_id: reply1Id,
          delete_password: 'delete reply1'
        })
        .end(function (err, res) {
          assert.equal(res.body.deleted, 'success')
          
          done()
        })
    })
    
    it('#10) reporting a reply', function (done) {
      chai.request(server)
        .put(REPLIESENDPOINT)
        .send({
          thread_id: thread1Id,
          reply_id: reply2Id      
        })
        .end(function (err, res) {
          assert.equal(res.status, 200)
          assert.equal(res.text, 'reported')

          done()
        })
    })
  })
});
