import psycopg2

con = None


if __name__ == "__main__":
    print("Testing 123")
    con = psycopg2.connect(
            host="178.128.174.137",
            database='crypto',
            user='crypto',
            password='crypto')
    curr = con.cursor()
    curr.execute("""select * from "PricePoint" pp where asset1 = 'XBT' order by created DESC LIMIT 2000;""")
    rows = curr.fetchall()
    for row in rows:
        print(row)
