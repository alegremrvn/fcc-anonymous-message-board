'use strict';

const { ObjectId } = require('mongodb')

let threads = {}

module.exports = function (app) {

  app.route('/api/threads/:board')

    .post((req, res) => {
      let board = req.params.board

      if (!threads.hasOwnProperty(board)) {
        threads[board] = []
      }

      let thread = {
        _id: new ObjectId(),
        text: req.body.text,
        delete_password: req.body.delete_password,
        replies: [],
        replycount: 0,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false
      }

      threads[board].push(thread)
      threads[board].sort((a, b) => b.bumped_on - a.bumped_on)

      res.send('go back then refresh.')
    })

    .get((req, res) => {
      let board = req.params.board

      if (!threads.hasOwnProperty(board)) {
        threads[board] = []
      }

      let output = JSON.parse(JSON.stringify(threads[board]))
      for (let thread of output) {
        delete thread.delete_password
        delete thread.reported

        if (thread.replycount > 3) {
          thread.replies = thread.replies.slice(thread.replycount - 3, thread.replycount)
        }
      }

      res.json(output)
    })

    .delete((req, res) => {
      let board = req.params.board

      const threadsCount = threads[board].length
      let count = 0
      for (let i = 0; i < threads[board].length; i++) {
        if (threads[board][i]._id.equals(new ObjectId(req.body.thread_id)) &&
        threads[board][i].delete_password === req.body.delete_password) {
          threads[board].splice(i, 1)
          break
        }
        count++
      }

      if (count === threadsCount) {
        res.json({
          not_deleted: 'incorrect password'
        })
      } else {
        res.json({
          deleted: 'success'
        })
      }
    })

    .put((req, res) => {
      const board = req.params.board

      res.status(200)
        .type('text')
        .send('reported')
    })

  app.route('/api/replies/:board')

    .post((req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id
      const date = new Date()

      let reply = {
        _id: new ObjectId(),
        text: req.body.text,
        delete_password: req.body.delete_password,
        created_on: date,
        reported: false
      }

      let thread
      for (let obj of threads[board]) {
        if (obj._id.equals(new ObjectId(thread_id))) {
          thread = obj
          break
        }
      }

      thread.replies.push(reply)
      thread.bumped_on = date
      thread.replycount++
      threads[board].sort((a, b) => b.bumped_on - a.bumped_on)

      res.send('go back then refresh.')
    })

    .get((req, res) => {
      try {
        const board = req.params.board
        const thread_id = req.query.thread_id

        let output
        for (let obj of threads[board]) {
          if (obj._id.equals(new ObjectId(thread_id))) {
            output = JSON.parse(JSON.stringify(obj))
            break
          }
        }

        delete output.delete_password
        delete output.reported

        for (let reply of output.replies) {
          delete reply.delete_password
          delete reply.reported
        }

        res.json(output)
      } catch (err) {
        console.log(err)
      }
    })

    .delete((req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id

      const repliesCount = threads[board][0].replies.length
      let count = 0
      for (let i = 0; i < threads[board][0].replies.length; i++) {
        if (threads[board][0].replies[i]._id.equals(new ObjectId(req.body.reply_id)) &&
        threads[board][0].replies[i].delete_password === req.body.delete_password) {
          threads[board][0].replies.splice(i, 1)
          break
        }
        count++
      }

      if (count === repliesCount) {
        res.json({
          not_deleted: 'incorrect password'
        })
      } else {
        res.json({
          deleted: 'success'
        })
      }
      
    })

    .put((req, res) => {
      const board = req.params.board

      res.status(200)
        .type('text')
        .send('reported')
    })

  app.route('/api/dbdump')
    .get((req, res) => {
      res.json(threads)
    })

};
