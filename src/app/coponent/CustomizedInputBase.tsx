'use client'
import * as React from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useState } from 'react'; // Correct import
import Image from 'next/image';

export default function CustomizedInputBase() {
  const [value, setValue] = useState(""); // Correct usage of useState
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handleSearch(term:any) {
    setValue(term);
  }

  function handleClick() { // Remove the term parameter
    const params = new URLSearchParams(searchParams);
    if (value) { // Use the value from the state
      params.set('query', value);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Paper
      component="form"
      sx={{boxShadow:"unset", border:"1px solid #C9C9C9 ", p: '2px 4px', display: 'flex', alignItems: 'center', width: "100%",borderRadius:"13px" }}
    >
      <InputBase
        style={{}}
        sx={{ ml: 1, flex: 1, textAlign: 'end' }}
        placeholder="جستجو"
        inputProps={{ 'aria-label': 'جستجو' }}
        defaultValue={searchParams.get('query')?.toString()}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleClick();
          }
        }}
      />
      <IconButton type="button" sx={{ p: '8px' }} aria-label="search" onClick={handleClick}>
      
        <Image
            src="/pic/search(1).svg"
            width={23}
            height={23}
            alt="Add"
            style={{
              cursor: "pointer", marginLeft:"10px"
            }}
          />
      </IconButton>
    </Paper>
  );
}
