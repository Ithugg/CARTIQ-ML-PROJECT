# Instacart Dataset

Download the Instacart Online Grocery Market Basket Analysis dataset from Kaggle and place the CSV files in this directory.

**Download:** https://www.kaggle.com/c/instacart-market-basket-analysis/data

## Required Files

After extracting the download, place these files here:

```
ml/data/
├── orders.csv
├── order_products__prior.csv
├── order_products__train.csv
├── products.csv
├── departments.csv
└── aisles.csv
```

## Dataset Scale

| File | Rows |
|---|---|
| orders.csv | ~3.4M |
| order_products__prior.csv | ~32M |
| order_products__train.csv | ~1.4M |
| products.csv | ~50K |
| departments.csv | 21 |
| aisles.csv | 134 |

## Schema

**orders.csv** — `order_id, user_id, eval_set, order_number, order_dow, order_hour_of_day, days_since_prior_order`

**order_products__prior.csv** — `order_id, product_id, add_to_cart_order, reordered`

**order_products__train.csv** — `order_id, product_id, add_to_cart_order, reordered`

**products.csv** — `product_id, product_name, aisle_id, department_id`

**departments.csv** — `department_id, department`

**aisles.csv** — `aisle_id, aisle`

## Notes

- `eval_set` in orders.csv is `'prior'`, `'train'`, or `'test'`
- The supervised label is `reordered` in `order_products__train.csv`
- Only `prior` and `train` eval_sets are used; the Kaggle `test` set has no labels
