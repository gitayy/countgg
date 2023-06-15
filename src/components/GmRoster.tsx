import { Container } from "@mui/material";
import { GridColDef, GridRowsProp, DataGrid } from "@mui/x-data-grid";

export function GmRoster(props) {

    var fa_columns: GridColDef[] = [
      { field: 'counter', headerName: 'Counter', minWidth: 100, flex: 1 },
      { field: 'id', headerName: 'Counter ID', minWidth: 100, flex: 1 },
      { field: 'numericID', headerName: 'Numeric ID', minWidth: 100, flex: 1 },
      { field: 'roles', headerName: 'Roles', minWidth: 100, flex: 1 },
    ];
  var statRows: object[] = []
  for(const counter in props.unapproved) {
      statRows.push({counter: props.unapproved[counter].name, id: props.unapproved[counter]['uuid'], numericID: props.unapproved[counter].id, roles: props.unapproved[counter]['roles'] })
  }
  const fa_rows: GridRowsProp = statRows;

return (
  <Container maxWidth="xl" sx={{ bgcolor: 'primary.light', p: 2}}>
    <DataGrid rows={fa_rows} columns={fa_columns} autoHeight={true} hideFooter={true} disableColumnMenu={true} checkboxSelection onSelectionModelChange={(newSelection) => {
          props.setSelection(newSelection);
      }}
      selectionModel={props.selection}></DataGrid>
  </Container>
)
}
