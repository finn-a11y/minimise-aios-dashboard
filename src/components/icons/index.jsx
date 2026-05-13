/**
 * Minimise Icon Set
 *
 * Wraps @phosphor-icons/react to default every icon to weight="regular".
 * All 93 icons re-exported — existing imports across 59 files stay untouched.
 */

import React from 'react';
import * as Phosphor from '@phosphor-icons/react';

function withDefault(IconComponent) {
  const Wrapped = React.forwardRef((props, ref) => (
    <IconComponent ref={ref} weight="regular" {...props} />
  ));
  Wrapped.displayName = IconComponent.displayName || IconComponent.name;
  return Wrapped;
}

export const AddressBook = withDefault(Phosphor.AddressBook);
export const ArrowDownRight = withDefault(Phosphor.ArrowDownRight);
export const ArrowLeft = withDefault(Phosphor.ArrowLeft);
export const ArrowRight = withDefault(Phosphor.ArrowRight);
export const ArrowsClockwise = withDefault(Phosphor.ArrowsClockwise);
export const ArrowSquareOut = withDefault(Phosphor.ArrowSquareOut);
export const ArrowUpRight = withDefault(Phosphor.ArrowUpRight);
export const Bell = withDefault(Phosphor.Bell);
export const Briefcase = withDefault(Phosphor.Briefcase);
export const Buildings = withDefault(Phosphor.Buildings);
export const Calendar = withDefault(Phosphor.Calendar);
export const CalendarBlank = withDefault(Phosphor.CalendarBlank);
export const CalendarCheck = withDefault(Phosphor.CalendarCheck);
export const CaretDown = withDefault(Phosphor.CaretDown);
export const CaretLeft = withDefault(Phosphor.CaretLeft);
export const CaretRight = withDefault(Phosphor.CaretRight);
export const CaretUp = withDefault(Phosphor.CaretUp);
export const ChartBar = withDefault(Phosphor.ChartBar);
export const ChartLine = withDefault(Phosphor.ChartLine);
export const ChartLineUp = withDefault(Phosphor.ChartLineUp);
export const ChatText = withDefault(Phosphor.ChatText);
export const Check = withDefault(Phosphor.Check);
export const CheckCircle = withDefault(Phosphor.CheckCircle);
export const Checks = withDefault(Phosphor.Checks);
export const Clock = withDefault(Phosphor.Clock);
export const Copy = withDefault(Phosphor.Copy);
export const Crosshair = withDefault(Phosphor.Crosshair);
export const CurrencyDollar = withDefault(Phosphor.CurrencyDollar);
export const DotsThree = withDefault(Phosphor.DotsThree);
export const DownloadSimple = withDefault(Phosphor.DownloadSimple);
export const EnvelopeSimple = withDefault(Phosphor.EnvelopeSimple);
export const Eye = withDefault(Phosphor.Eye);
export const FacebookLogo = withDefault(Phosphor.FacebookLogo);
export const Factory = withDefault(Phosphor.Factory);
export const FileArrowUp = withDefault(Phosphor.FileArrowUp);
export const FileCsv = withDefault(Phosphor.FileCsv);
export const FileText = withDefault(Phosphor.FileText);
export const FloppyDisk = withDefault(Phosphor.FloppyDisk);
export const Funnel = withDefault(Phosphor.Funnel);
export const GearSix = withDefault(Phosphor.GearSix);
export const Globe = withDefault(Phosphor.Globe);
export const GoogleLogo = withDefault(Phosphor.GoogleLogo);
export const Handshake = withDefault(Phosphor.Handshake);
export const Hash = withDefault(Phosphor.Hash);
export const House = withDefault(Phosphor.House);
export const IdentificationBadge = withDefault(Phosphor.IdentificationBadge);
export const Info = withDefault(Phosphor.Info);
export const Kanban = withDefault(Phosphor.Kanban);
export const Key = withDefault(Phosphor.Key);
export const Lightning = withDefault(Phosphor.Lightning);
export const Link = withDefault(Phosphor.Link);
export const LinkBreak = withDefault(Phosphor.LinkBreak);
export const LinkedinLogo = withDefault(Phosphor.LinkedinLogo);
export const List = withDefault(Phosphor.List);
export const Lock = withDefault(Phosphor.Lock);
export const MagnifyingGlass = withDefault(Phosphor.MagnifyingGlass);
export const MapPin = withDefault(Phosphor.MapPin);
export const MetaLogo = withDefault(Phosphor.MetaLogo);
export const Microphone = withDefault(Phosphor.Microphone);
export const MicrophoneStage = withDefault(Phosphor.MicrophoneStage);
export const Moon = withDefault(Phosphor.Moon);
export const Pause = withDefault(Phosphor.Pause);
export const PencilSimple = withDefault(Phosphor.PencilSimple);
export const Phone = withDefault(Phosphor.Phone);
export const PhoneCall = withDefault(Phosphor.PhoneCall);
export const PhoneIncoming = withDefault(Phosphor.PhoneIncoming);
export const PhoneOutgoing = withDefault(Phosphor.PhoneOutgoing);
export const PhoneSlash = withDefault(Phosphor.PhoneSlash);
export const Play = withDefault(Phosphor.Play);
export const Plugs = withDefault(Phosphor.Plugs);
export const Sparkle = withDefault(Phosphor.Sparkle);
export const Stack = withDefault(Phosphor.Stack);
export const CloudArrowUp = withDefault(Phosphor.CloudArrowUp);
export const ArrowsDownUp = withDefault(Phosphor.ArrowsDownUp);
export const Plus = withDefault(Phosphor.Plus);
export const Printer = withDefault(Phosphor.Printer);
export const Pulse = withDefault(Phosphor.Pulse);
export const Question = withDefault(Phosphor.Question);
export const Rocket = withDefault(Phosphor.Rocket);
export const ShieldCheck = withDefault(Phosphor.ShieldCheck);
export const SignOut = withDefault(Phosphor.SignOut);
export const SpinnerGap = withDefault(Phosphor.SpinnerGap);
export const Target = withDefault(Phosphor.Target);
export const Timer = withDefault(Phosphor.Timer);
export const Trash = withDefault(Phosphor.Trash);
export const TrendDown = withDefault(Phosphor.TrendDown);
export const TrendUp = withDefault(Phosphor.TrendUp);
export const User = withDefault(Phosphor.User);
export const UserCircle = withDefault(Phosphor.UserCircle);
export const UserCirclePlus = withDefault(Phosphor.UserCirclePlus);
export const UserPlus = withDefault(Phosphor.UserPlus);
export const Users = withDefault(Phosphor.Users);
export const UsersFour = withDefault(Phosphor.UsersFour);
export const UsersThree = withDefault(Phosphor.UsersThree);
export const UserSwitch = withDefault(Phosphor.UserSwitch);
export const Warning = withDefault(Phosphor.Warning);
export const WarningCircle = withDefault(Phosphor.WarningCircle);
export const X = withDefault(Phosphor.X);
export const XCircle = withDefault(Phosphor.XCircle);
export const Columns = withDefault(Phosphor.Columns);
export const SortAscending = withDefault(Phosphor.SortAscending);
export const SortDescending = withDefault(Phosphor.SortDescending);
export const Note = withDefault(Phosphor.Note);
export const Paperclip = withDefault(Phosphor.Paperclip);
export const PaperPlaneTilt = withDefault(Phosphor.PaperPlaneTilt);
