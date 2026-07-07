package helpers

import (
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

func NumericToFloat64(n pgtype.Numeric) (float64, error) {
	if !n.Valid {
		return 0, fmt.Errorf("null numeric")
	}
	f, err := n.Float64Value()
	if err != nil {
		return 0, err
	}
	return f.Float64, nil
}
