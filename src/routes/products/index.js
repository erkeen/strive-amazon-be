const express = require("express");
const db = require("../../db");

const router = express.Router();

router.get("/", async (req, res) => {
  const order = req.query.order || "asc";
  const offset = req.query.offset || 0;
  const limit = req.query.limit || 10;

  delete req.query.order;
  delete req.query.offset;
  delete req.query.limit;

  let query = 'SELECT * FROM "Products" ';

  const params = [];
  for (queryParam in req.query) {
    params.push(req.query[queryParam]);

    if (params.length === 1)
      query += `WHERE ${queryParam} = $${params.length} `;
    else query += ` AND ${queryParam} = $${params.length} `;
  }

  query += " ORDER BY Name " + order;
  params.push(limit);
  query += ` LIMIT $${params.length} `;
  params.push(offset);
  query += ` OFFSET $${params.length}`;

  console.log(query);

  const response = await db.query(query, params);
  res.send(response.rows);
});

router.get("/search/:query", async (req, res) => {
  const response = await db.query(
    `SELECT * FROM "Products" WHERE 
                                    name ILIKE '${
                                      "%" + req.params.query + "%"
                                    }' OR
                                    brand ILIKE '${
                                      "%" + req.params.query + "%"
                                    }'
                                    LIMIT $1 OFFSET $2 
                                    `,
    [req.query.limit || 10, req.query.offset || 0]
  );

  res.send(response.rows);
});

router.get("/:id", async (req, res) => {
  const response = await db.query(
    'SELECT _id, name, description, brand, image_url, price, category FROM "Products" WHERE _id = $1',
    [req.params.id]
  );

  if (response.rowCount === 0) return res.status(404).send("Not found");

  res.send(response.rows[0]);
});

router.post("/", async (req, res) => {
  const response = await db.query(
    `INSERT INTO "Products" (name, description, brand, image_url, price, category, created_at, updated_at) 
                                     Values ($1, $2, $3, $4, $5, $6, $7, $8)
                                     RETURNING *`,
    [
      req.body.name,
      req.body.description,
      req.body.brand,
      req.body.image_url,
      req.body.price,
      req.body.category,
      req.body.created_at,
      req.body.updated_at,
    ]
  );

  console.log(response);
  res.send(response.rows[0]);
});

router.put("/:id", async (req, res) => {
  try {
    let params = [];
    let query = 'UPDATE "Products" SET ';
    for (bodyParamName in req.body) {
      query +=
        (params.length > 0 ? ", " : "") +
        bodyParamName +
        " = $" +
        (params.length + 1);
      params.push(req.body[bodyParamName]);
    }

    params.push(req.params.id);
    query += " WHERE _id = $" + params.length + " RETURNING *";
    console.log(query);

    const result = await db.query(query, params);

    if (result.rowCount === 0) return res.status(404).send("Not Found");

    res.send(result.rows[0]);
  } catch (ex) {
    console.log(ex);
    res.status(500).send(ex);
  }
});

router.delete("/:id", async (req, res) => {
  const response = await db.query(`DELETE FROM "Products" WHERE _id = $1`, [
    req.params.id,
  ]);

  if (response.rowCount === 0) return res.status(404).send("Not Found");

  res.send("OK");
});

module.exports = router;
