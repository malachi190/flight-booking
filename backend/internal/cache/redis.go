package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	rdb *redis.Client
}

func New(addr, password string, db int) *Client {
	return &Client{
		rdb: redis.NewClient(&redis.Options{
			Addr:     addr,
			Password: password,
			DB:       db,
		}),
	}
}

func (c *Client) Ping(ctx context.Context) error {
	return c.rdb.Ping(ctx).Err()
}

func FlightSearchKey(origin, destination, date, class string, adults int) string {
	if class == "" {
		class = "any"
	}

	return fmt.Sprintf("flights:search:%s:%s:%s:%s:%d", origin, destination, date, class, adults)
}

func (c *Client) GetFlightSearch(ctx context.Context, key string) ([]byte, bool) {
	val, err := c.rdb.Get(ctx, key).Bytes()

	if err != nil {
		return nil, false
	}
	return val, true
}

func (c *Client) SetFlightSearch(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return c.rdb.Set(ctx, key, value, ttl).Err()
}
