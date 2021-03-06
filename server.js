const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const userDB = require('./data/helpers/userDb');
const postDB = require('./data/helpers/postDb');
const tagDB = require('./data/helpers/tagDb');

const server = express();
// turn on express's body parser, using JSON data
server.use(express.json());
// turn on CORS
server.use(cors());
// security features, activated!
server.use(helmet());

const PORT = 8000;

server.get('/', (req, res) => {
  res.send('TADA!');
});

function toUpperCase(req, res, next) {
  if (req.body.tag) req.body.tag = req.body.tag.toUpperCase();
  next();
}

// display all users
server.get('/users', async (req, res) => {
  try {
    const response = await userDB.get();
    return res.status(200).json(response);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'The users information could not be retrieved.' });
  }
});
server.get('/users', async (req, res) => {
  try {
    const response = await userDB.get();
    return res.status(200).json(response);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'The users information could not be retrieved.' });
  }
});

// add a new user
server.post('/users', async (req, res) => {
  const NAME = req.body.name;

  if (!NAME) {
    res.status(400).json({
      error: 'Please provide a name for the new user.',
    });
    return;
  }

  if (NAME.length > 128) {
    res
      .status(400)
      .json({ error: 'Please keep the name shorter than 128 characters.' });
    return;
  }

  try {
    const response = await userDB.insert({ NAME });
    // response is { id: # }
    return res.status(200).json(`User id:${response.id} has been added.`);
  } catch (err) {
    return res.status(500).json({ error: `User could not be added.` });
  }
});

// edit a user
server.put('/users/:id', async (req, res) => {
  const NAME = req.body.name;
  const ID = req.params.id;

  if (!NAME) {
    res.status(400).json({
      error: 'Please provide the updated name for the user.',
    });
    return;
  }

  if (NAME.length > 128) {
    res
      .status(400)
      .json({ error: 'Please keep the name shorter than 128 characters.' });
    return;
  }

  const USER = { name: NAME };

  // ensure user with that ID exists
  try {
    const response = await userDB.get(ID);
    if (typeof response === 'undefined')
      return res.status(404).json({ error: `No user with id:${ID} exists.` });
    // found user, so edit it
    try {
      const response = await userDB.update(ID, USER);
      console.log('RESPONSE', response);
      res.status(200).json({ messsage: `User with id ${ID} has been editied` });
    } catch (err) {
      return res
        .status(500)
        .json({ error: `The user with id:${ID} could not be edited.` });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: `The user with id:${ID} could not be retrieved.` });
  }
});

// delete a user
server.delete('/users/:id', async (req, res) => {
  const ID = req.params.id;

  try {
    const response = await userDB.remove(ID);
    // if deleted, response = 1, otherwise = 0
    if (response)
      return res.status(200).json(`User id:${ID} has been deleted.`);
    else return res.status(400).json(`User id:${ID} does not exist.`);
  } catch (err) {
    return res
      .status(500)
      .json({ error: `User id:${ID} could not be deleted.` });
  }
});

// display an individual user
server.get('/users/:id', async (req, res) => {
  const ID = req.params.id;

  try {
    const response = await userDB.get(ID);
    if (typeof response === 'undefined')
      return res.status(404).json({ error: `No user with id:${ID} exists.` });
    return res.status(200).json(response);
  } catch (err) {
    return res
      .status(500)
      .json({ error: `The user with id:${ID} could not be retrieved.` });
  }
});

// display all of an individual user's posts
server.get('/users/:id/posts', async (req, res) => {
  const ID = req.params.id;

  // make sure user exists
  try {
    const response = await userDB.get(ID);
    if (typeof response === 'undefined')
      return res.status(404).json({ error: `No user with id:${ID} exists.` });

    //exists, so get the posts
    try {
      const response = await userDB.getUserPosts(ID);
      if (response.length === 0)
        return res.status(200).json(`User id:${ID} has no posts.`);
      else return res.status(200).json(response);
    } catch (err) {
      return res
        .status(500)
        .json({ error: `User id:${ID} could not be retrieved.` });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: `User id:${ID} could not be retrieved.` });
  }
});

// display all posts
server.get('/posts', async (req, res) => {
  try {
    const response = await postDB.get();
    return res.status(200).json(response);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'The posts information could not be retrieved.' });
  }
});

// display an individual post
server.get('/posts/:id', async (req, res) => {
  const ID = req.params.id;

  try {
    const response = await postDB.get(ID);
    return res.status(200).json(response);
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Post id:${ID} could not be retrieved.` });
  }
});

// display an individual post's tags
server.get('/posts/:id/tags', async (req, res) => {
  const ID = req.params.id;

  // make sure the post exists
  try {
    await postDB.get(ID);
    try {
      const tagResponse = await postDB.getPostTags(ID);
      if (tagResponse.length === 0)
        res.status(200).json({ message: `Post id:${ID} has no tags` });
      else return res.status(200).json(tagResponse);
    } catch (err) {
      return res
        .status(500)
        .json({ error: 'The tags information could not be retrieved.' });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Post id:${ID} could not be retrieved.` });
  }
});

// add a new post
server.post('/posts/:id', async (req, res) => {
  const ID = req.params.id;
  const TEXT = req.body.text;

  if (!TEXT) {
    res.status(400).json({
      error: 'Please provide the text for the new post.',
    });
    return;
  }

  const post = { userId: ID, text: TEXT };

  // make sure user exists
  try {
    const response = await userDB.get(ID);
    if (typeof response === 'undefined')
      return res.status(404).json({ error: `No user id:${ID} exists.` });
    // user exists, add the post
    try {
      const response = await postDB.insert(post);
      // reponse is { id: # }
      return res.status(200).json(`A post for user id:${ID} has been added.`);
    } catch (err) {
      return res.status(500).json({ error: `The post could not be added.` });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: `User id:${ID} could not be retrieved.` });
  }
});

// edit a post
server.put('/posts/:id', async (req, res) => {
  const TEXT = req.body.text;
  const ID = req.params.id;

  if (!TEXT) {
    res.status(400).json({
      error: 'Please provide the updated text for the post.',
    });
    return;
  }

  const POST = { text: TEXT };

  // ensure post with that ID exists
  try {
    await postDB.get(ID);
    try {
      const response = await postDB.update(ID, POST);
      res.status(200).json({ message: `Post id:${ID} has been updated` });
    } catch (err) {
      return res
        .status(500)
        .json({ error: `Post id:${ID} could not be updated.` });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Post id:${ID} could not be retrieved.` });
  }
});

// delete a post
server.delete('/posts/:id', async (req, res) => {
  const ID = req.params.id;

  try {
    const response = await postDB.remove(ID);
    // if deleted, response = 1, otherwise = 0
    if (response)
      return res.status(200).json(`Post id:${ID} has been deleted.`);
    else return res.status(400).json(`Post id:${ID} does not exist.`);
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Post id:${ID} could not be deleted.` });
  }
});

// display all tags
server.get('/tags', async (req, res) => {
  try {
    const response = await tagDB.get();
    return res.status(200).json(response);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'The tags information could not be retrieved.' });
  }
});

// display an individual tag
server.get('/tags/:id', async (req, res) => {
  const ID = req.params.id;

  try {
    const response = await tagDB.get(ID);
    if (typeof response === 'undefined')
      res.status(404).json({ error: `No tag with id:${ID} exists` });
    return res.status(200).json(response);
  } catch (err) {
    return res
      .status(500)
      .json({ error: `The tag with id:${ID} could not be retrieved.` });
  }
});

// add a new tag
server.post('/tags', toUpperCase, async (req, res) => {
  const TAG = req.body.tag;

  if (!TAG) {
    res.status(400).json({
      error: 'Please provide the tag.',
    });
    return;
  }

  if (TAG.length > 80) {
    res.status(400).json({
      error: 'Tag must be fewer than 80 characters.',
    });
    return;
  }

  const tag = { tag: TAG };

  try {
    const response = await tagDB.insert(tag);
    // response is { id: # }
    return res.status(200).json(`Tag id:${response.id} has been added.`);
  } catch (err) {
    if (err.errno == 19)
      // dup
      return res.status(500).json({ error: `No duplicate tags` });
    else return res.status(500).json({ error: `The tag could not be added.` });
  }
});

// edit a tag
server.put('/tags/:id', toUpperCase, async (req, res) => {
  const ID = req.params.id;
  const TAG = req.body.tag;

  if (!TAG) {
    res.status(400).json({
      error: 'Please provide the tag.',
    });
    return;
  }

  if (TAG.length > 80) {
    res.status(400).json({
      error: 'Tag must be fewer than 80 characters.',
    });
    return;
  }

  // does the tag exist?
  try {
    const response = await tagDB.get(ID);
    if (typeof response === 'undefined')
      res.status(404).json({ error: `Tag with id:${ID} exists` });
    //edit the tag
    try {
      const response = await tagDB.update(ID, { tag: TAG });
      res.status(200).json({ message: `Tag id:${ID} has been updated.` });
    } catch (err) {
      return res
        .status(500)
        .json({ error: `Tag with id:${ID} could not be updated.` });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Tag with id:${ID} could not be retrieved.` });
  }
});

// delete a tag
server.delete('/tags/:id', async (req, res) => {
  const ID = req.params.id;

  try {
    const response = await tagDB.remove(ID);
    // if deleted, response = 1, otherwise = 0
    if (response) return res.status(200).json(`Tag id:${ID} has been deleted.`);
    else return res.status(400).json(`Tag id:${ID} does not exist.`);
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Tag id:${ID} could not be deleted.` });
  }
});

server.use((req, res) =>
  res.status(404).send(`<h1>404: resource "${req.url}" not found</h1>`),
);

server.listen(
  PORT,
  console.log(`Server listening on http://localhost:${PORT}\n`),
);
