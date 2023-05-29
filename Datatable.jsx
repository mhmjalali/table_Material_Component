import useLanguage from "@/lib/app/hooks/useLanguage";
import { Typography } from "@mui/material";
import axios from "axios";
import MaterialReactTable from "material-react-table";
import moment from "moment";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const fetcher = (...args) => axios.get(args).then((res) => res.data.data);

const DataTable = (props) => {
  const t = useTranslations();
  const { languageApp, languageList } = useLanguage();
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnFilterFns, setColumnFilterFns] = useState(() => {
    let output = {};
    const list = props.columns.map((item) =>
      item.enableColumnFilter
        ? { [item.id]: item.defaultFilterFn }
        : { [item.id]: "" }
    );
    for (var key in list) {
      var nestedObj = list[key];
      for (var nestedKey in nestedObj) {
        output[nestedKey] = nestedObj[nestedKey];
      }
    }
    return output;
  });
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [updateTime, setupdateTime] = useState(
    moment().locale(languageApp).format("LL (HH:mm:ss)")
  );

  const tableLocalization = useMemo(
    () =>
      languageList.find((item) => item.key == languageApp).tableLocalization,
    [languageApp, languageList]
  );

  const fetchUrl = useMemo(() => {
    const url = new URL(props.tableUrl /* send your api */);
    url.searchParams.set(
      "start",
      `${pagination.pageIndex * pagination.pageSize}`
    );

    const filters = columnFilters.map((filter) => {
      if (columnFilterFns[filter.id] == "between") {
        if (
          filter.value.every((item) => item !== "") &&
          filter.value.every((item) => item !== undefined)
        ) {
          return {
            ...filter,
            fn: columnFilterFns[filter.id],
          };
        }
        return null;
      }

      return {
        ...filter,
        fn: columnFilterFns[filter.id],
      };
    });

    url.searchParams.set("size", pagination.pageSize);
    url.searchParams.set("filters", JSON.stringify(filters ?? []));
    url.searchParams.set("sorting", JSON.stringify(sorting ?? []));
    return url;
  }, [
    props.tableUrl,
    columnFilters,
    columnFilterFns,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ]);

  const { data, isLoading, isValidating } = useSWR(fetchUrl, fetcher);

  useEffect(() => {
    setupdateTime(moment().locale(languageApp).format("LL (HH:mm:ss)"));
  }, [isValidating]);

  return (
    <MaterialReactTable
      localization={tableLocalization}
      columns={props.columns} /* columns you send */
      // data={data ?? []}
      data={data ?? []}
      manualFiltering
      manualPagination
      manualSorting
      enableRowSelection={props.selectableRow} /* send condition */
      enablePinning={props.enablePinning} /* send condition */
      enableColumnFilters={props.enableColumnFilters} /* send condition */
      enableDensityToggle={props.enableDensityToggle} /* send condition */
      enableHiding={props.enableHiding} /* send condition */
      enableFullScreenToggle={props.enableFullScreenToggle} /* send condition */
      enableColumnResizing={props.enableColumnResizing}
      muiTableHeadCellProps={{
        sx: {
          color: "primary.main",
          "& .Mui-TableHeadCell-Content": { justifyContent: "space-between" },
        },
      }}
      enableColumnFilterModes
      muiTablePaperProps={{ elevation: 0 }}
      onColumnFilterFnsChange={setColumnFilterFns}
      onColumnFiltersChange={setColumnFilters}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (
        <>
          {props.enableCustomToolbar /* send condition */
            ? props.CustomToolbar /* send component */
            : ""}
        </>
      )}
      renderBottomToolbarCustomActions={({ table }) => (
        <>
          {props.enableLastUpdate /* send condition */ ? (
            <Typography
              sx={{
                color: "primary.main",
                alignSelf: "center",
                whiteSpace: "nowrap",
                maxWidth: { xs: 100, sm: "100%" },
                overflowX: "scroll",
              }}
              variant="caption"
            >
              {t("last_updated_at")}: {updateTime}
            </Typography>
          ) : (
            ""
          )}
        </>
      )}
      state={{
        isLoading,
        columnFilters,
        columnFilterFns,
        pagination,
        sorting,
      }}
      positionActionsColumn={"last"}
      enableRowActions={props.enableRowActions}
      {...props}
    />
  );
};

export default DataTable;
