"use client";
import styled from "styled-components";

export const Input = styled.input`
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 10px;
  padding: 12px 14px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  min-height: 44px;
  &::placeholder { color: #737373; }
  &:focus { border-color: #7c3aed; }
`;

export const Textarea = styled.textarea`
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 10px;
  padding: 12px 14px;
  color: #fff;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: border-color 0.15s;
  &::placeholder { color: #737373; }
  &:focus { border-color: #7c3aed; }
`;
