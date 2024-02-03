import { Box } from '@mui/material'
import { DataGrid, GridColDef, GridRowsProp, GridToolbar } from '@mui/x-data-grid'

export function CounterStatsTables(props) {
  function buildStandardTableRows(props) {
    var allRows: JSX.Element[] = []
    for (const season in props.stats) {
      allRows.push(
        <tr key={`${season}`}>
          <td>
            {season != 'Career' && 'Season'} {season}
          </td>
          <td>{props.stats[season]['PA']}</td>
          <td>{props.stats[season]['AB']}</td>
          <td>{props.stats[season]['H']}</td>
          <td>{props.stats[season]['R']}</td>
        </tr>,
      )
    }
    return allRows
  }

  function buildAdvancedTableRows(props) {
    var allRows: JSX.Element[] = []
    for (const season in props.stats) {
      allRows.push(
        <tr key={`${season}`}>
          <td>
            {season != 'Career' && 'Season'} {season}
          </td>
          <td>{props.stats[season]['PA']}</td>
          <td>{props.stats[season]['AB']}</td>
        </tr>,
      )
    }
    return allRows
  }

  function buildMultipleTables(props) {
    var allRows: JSX.Element[] = []
    for (const split in props.splits) {
      allRows.push(
        <div key={`${props.splits[split]}`}>
          <h5>{props.splits[split]}</h5>
          <h6>Standard</h6>
          <table className="border no-space">
            <thead>
              <tr key={`${props.splits[split]}`}>
                <th></th>
                <th>PA</th>
                <th>AB</th>
                <th>H</th>
                <th>R</th>
              </tr>
            </thead>
            <tbody>{buildStandardTableRows(props)}</tbody>
          </table>
          <h6>Advanced</h6>
          <table className="border no-space">
            <thead>
              <tr key={`${props.splits[split]}`}>
                <th></th>
                <th>PA</th>
                <th>AB</th>
              </tr>
            </thead>
            <tbody>{buildAdvancedTableRows(props)}</tbody>
          </table>
        </div>,
      )
    }
    return allRows
  }

  const columns: GridColDef[] = [
    { field: 'season', headerName: 'Season', minWidth: 100, flex: 1 },
    { field: 'PA', headerName: 'PA', flex: 1 },
    { field: 'AB', headerName: 'AB', flex: 1 },
    { field: 'H', headerName: 'H', flex: 1 },
    { field: 'R', headerName: 'R', flex: 1 },
    { field: 'RBI', headerName: 'RBI', flex: 1 },
    { field: 'AVG', headerName: 'AVG', flex: 1 },
    { field: 'OBP', headerName: 'OBP', flex: 1 },
    { field: 'SLG', headerName: 'SLG', flex: 1 },
    { field: 'OPS', headerName: 'OPS', flex: 1 },
  ]
  var statRows: object[] = []
  for (const season in props.stats) {
    statRows.push({ id: season, season: season, ...props.stats[season] })
  }
  const rows: GridRowsProp = statRows

  return (
    <>
      {/* {buildMultipleTables(props)} */}
      {/* <div style={{ height: 300, width: '100%' }}> */}
      <Box sx={{ bgcolor: 'background.paper' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight={true}
          hideFooter={true}
          disableColumnMenu={true}
          components={{ Toolbar: GridToolbar }}
          componentsProps={{ toolbar: { printOptions: { disableToolbarButton: true } } }}
        ></DataGrid>
      </Box>
      {/* </div> */}
    </>
  )
}
