import React, { useState } from 'react'
import { FormControl, InputLabel, MenuItem, Select, Chip } from '@mui/material'
import { Counter } from '../utils/types'

interface UserMultiSelectProps {
  users: { [key: string]: Counter }
  selectedUsers: Counter[]
  onSelectedUsersChange: (selectedUsers: Counter[]) => void
}

const UserMultiSelect = ({ users, selectedUsers, onSelectedUsersChange }: UserMultiSelectProps) => {
  const handleChange = (event) => {
    const newSelectedUsers = event.target.value
    onSelectedUsersChange(newSelectedUsers)
  }

  return (
    <FormControl>
      <InputLabel id="user-multiselect-label">Select Users</InputLabel>
      <Select
        labelId="user-multiselect-label"
        id="user-multiselect"
        multiple
        value={selectedUsers}
        onChange={handleChange}
        renderValue={(selected) => (
          <div>
            {selected.map((counter) => (
              <Chip
                key={counter.username}
                label={counter.username}
                onDelete={() => onSelectedUsersChange(selected.filter((c) => c.uuid !== counter.uuid))}
              />
            ))}
          </div>
        )}
      >
        {Object.keys(users).map((userId) => (
          <MenuItem key={users[userId].username} value={users[userId].username}>
            {users[userId].username}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default UserMultiSelect
