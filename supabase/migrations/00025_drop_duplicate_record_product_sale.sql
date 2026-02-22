-- 00018でCREATE OR REPLACEしたが、パラメータ数が変わったためオーバーロードになり
-- 旧7パラメータ版が残存。PostgRESTが300 (Multiple Choices)を返す原因。
-- 旧版をDROPし、8パラメータ版のみ残す。

DROP FUNCTION IF EXISTS record_product_sale(uuid, uuid, uuid, integer, integer, date, text);
